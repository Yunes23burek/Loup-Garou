import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';

export interface VoiceState {
  hasMicPermission: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0 to 100
  isSpookyFilterActive: boolean;
  isTestingMic: boolean;
  activePeerCount: number;
}

type SpeakingChangeCallback = (isSpeaking: boolean, level: number) => void;

class VoiceManager {
  private localStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private loopbackGain: GainNode | null = null;
  private rafId: number | null = null;

  public state: VoiceState = {
    hasMicPermission: false,
    isMuted: false,
    isSpeaking: false,
    audioLevel: 0,
    isSpookyFilterActive: false,
    isTestingMic: false,
    activePeerCount: 0
  };

  private speakingListeners: Set<SpeakingChangeCallback> = new Set();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private unsubscribeSignals: (() => void) | null = null;
  private roomId: string | null = null;
  private localPlayerId: string | null = null;

  // ICE configuration for WebRTC
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  public onSpeakingChange(cb: SpeakingChangeCallback) {
    this.speakingListeners.add(cb);
    return () => this.speakingListeners.delete(cb);
  }

  // Request Microphone Access & Setup Analyser
  public async initMicrophone(): Promise<boolean> {
    try {
      if (this.localStream) return true;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.localStream = stream;
      this.state.hasMicPermission = true;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;

      // Spooky Filter (lowpass + resonant peak for deep wolf-like rumble)
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 850;
      this.filterNode.Q.value = 6;

      this.sourceNode.connect(this.analyser);

      // Loopback for testing
      this.loopbackGain = this.audioCtx.createGain();
      this.loopbackGain.gain.value = 0; // default off
      this.sourceNode.connect(this.loopbackGain);
      this.loopbackGain.connect(this.audioCtx.destination);

      this.startAudioMeter();
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      this.state.hasMicPermission = false;
      return false;
    }
  }

  // Monitor speaking levels via AnalyserNode
  private startAudioMeter() {
    if (!this.analyser) return;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const normalized = Math.min(100, Math.round((average / 128) * 100));

      this.state.audioLevel = normalized;
      const isSpeakingNow = !this.state.isMuted && normalized > 12;

      if (this.state.isSpeaking !== isSpeakingNow) {
        this.state.isSpeaking = isSpeakingNow;
      }

      this.speakingListeners.forEach(cb => cb(isSpeakingNow, normalized));
      this.rafId = requestAnimationFrame(checkVolume);
    };

    this.rafId = requestAnimationFrame(checkVolume);
  }

  // Toggle Mute
  public toggleMute(): boolean {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      this.state.isMuted = !this.localStream.getAudioTracks()[0]?.enabled;
    } else {
      this.state.isMuted = !this.state.isMuted;
    }
    return this.state.isMuted;
  }

  // Toggle Spooky Werewolf Voice Modulator
  public toggleSpookyFilter(): boolean {
    this.state.isSpookyFilterActive = !this.state.isSpookyFilterActive;
    if (this.sourceNode && this.filterNode && this.analyser) {
      try {
        this.sourceNode.disconnect();
        if (this.state.isSpookyFilterActive) {
          this.sourceNode.connect(this.filterNode);
          this.filterNode.connect(this.analyser);
        } else {
          this.sourceNode.connect(this.analyser);
        }
      } catch {
        // Fallback
      }
    }
    return this.state.isSpookyFilterActive;
  }

  // Toggle Mic Loopback Test
  public toggleMicTest(): boolean {
    if (!this.loopbackGain || !this.audioCtx) return false;
    this.state.isTestingMic = !this.state.isTestingMic;
    this.loopbackGain.gain.setValueAtTime(
      this.state.isTestingMic ? 0.8 : 0, 
      this.audioCtx.currentTime
    );
    return this.state.isTestingMic;
  }

  // Initialize WebRTC Signaling Room via Firestore
  public startWebRTCRoom(roomId: string, localPlayerId: string, peerIds: string[]) {
    this.roomId = roomId;
    this.localPlayerId = localPlayerId;

    // Clean up prior listeners
    if (this.unsubscribeSignals) {
      this.unsubscribeSignals();
    }

    const signalsPath = `rooms/${roomId}/voiceSignals`;
    try {
      const q = query(
        collection(db, signalsPath),
        where('targetId', '==', localPlayerId)
      );

      this.unsubscribeSignals = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            await this.handleIncomingSignal(data.senderId, data.type, JSON.parse(data.data));
            // Cleanup signal document once consumed
            try {
              await deleteDoc(change.doc.ref);
            } catch {
              // Ignore
            }
          }
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, signalsPath);
      });
    } catch {
      // Offline fallback
    }

    // Connect to peers who have higher IDs to avoid double offers
    peerIds.forEach(peerId => {
      if (peerId !== localPlayerId && localPlayerId < peerId) {
        this.initiatePeerCall(peerId);
      }
    });
  }

  private async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peerConnections.set(peerId, pc);

    // Add local mic stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.localStream) {
          pc.addTrack(track, this.localStream);
        }
      });
    }

    // Handle remote audio stream
    pc.ontrack = (event) => {
      let audioEl = this.remoteAudioElements.get(peerId);
      if (!audioEl) {
        audioEl = new Audio();
        audioEl.autoplay = true;
        this.remoteAudioElements.set(peerId, audioEl);
      }
      audioEl.srcObject = event.streams[0];
    };

    // Send ICE candidates to peer via Firestore
    pc.onicecandidate = async (event) => {
      if (event.candidate && this.roomId && this.localPlayerId) {
        try {
          await addDoc(collection(db, `rooms/${this.roomId}/voiceSignals`), {
            senderId: this.localPlayerId,
            targetId: peerId,
            type: 'candidate',
            data: JSON.stringify(event.candidate),
            timestamp: Date.now()
          });
        } catch {
          // Ignored
        }
      }
    };

    return pc;
  }

  private async initiatePeerCall(peerId: string) {
    if (!this.roomId || !this.localPlayerId) return;
    const pc = await this.createPeerConnection(peerId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await addDoc(collection(db, `rooms/${this.roomId}/voiceSignals`), {
        senderId: this.localPlayerId,
        targetId: peerId,
        type: 'offer',
        data: JSON.stringify(offer),
        timestamp: Date.now()
      });
    } catch (err) {
      console.warn('Failed to send WebRTC offer:', err);
    }
  }

  private async handleIncomingSignal(senderId: string, type: string, payload: unknown) {
    let pc = this.peerConnections.get(senderId);
    if (!pc) {
      pc = await this.createPeerConnection(senderId);
    }

    try {
      if (type === 'offer') {
        const offer = payload as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (this.roomId && this.localPlayerId) {
          await addDoc(collection(db, `rooms/${this.roomId}/voiceSignals`), {
            senderId: this.localPlayerId,
            targetId: senderId,
            type: 'answer',
            data: JSON.stringify(answer),
            timestamp: Date.now()
          });
        }
      } else if (type === 'answer') {
        const answer = payload as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } else if (type === 'candidate') {
        const candidate = payload as RTCIceCandidateInit;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.warn('Signal handling error:', err);
    }
  }

  public cleanup() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.unsubscribeSignals) this.unsubscribeSignals();
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.remoteAudioElements.forEach(el => {
      el.srcObject = null;
    });
    this.remoteAudioElements.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.state.hasMicPermission = false;
    this.state.isSpeaking = false;
  }
}

export const voiceManager = new VoiceManager();
