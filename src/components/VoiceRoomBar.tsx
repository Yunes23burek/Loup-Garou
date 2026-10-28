import { useState, useEffect } from 'react';
import { voiceManager, VoiceState } from '../audio/voiceManager';
import { Language } from '../types/game';
import { TRANSLATIONS } from '../i18n/translations';
import { Mic, MicOff, Volume2, Sparkles, Radio, CheckCircle2 } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface VoiceRoomBarProps {
  lang: Language;
  onSpeakingStateChange?: (isSpeaking: boolean) => void;
  activeSpeakersCount?: number;
}

export function VoiceRoomBar({ lang, onSpeakingStateChange, activeSpeakersCount = 1 }: VoiceRoomBarProps) {
  const t = TRANSLATIONS[lang];
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceManager.state);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const unsub = voiceManager.onSpeakingChange((isSpeaking) => {
      setVoiceState({ ...voiceManager.state });
      if (onSpeakingStateChange) {
        onSpeakingStateChange(isSpeaking);
      }
    });

    return () => {
      unsub();
    };
  }, [onSpeakingStateChange]);

  const handleToggleMic = async () => {
    sound.playClick();
    if (!voiceState.hasMicPermission) {
      setIsInitializing(true);
      const ok = await voiceManager.initMicrophone();
      setIsInitializing(false);
      setVoiceState({ ...voiceManager.state });
      return;
    }

    voiceManager.toggleMute();
    setVoiceState({ ...voiceManager.state });
  };

  const handleToggleSpooky = () => {
    sound.playClick();
    voiceManager.toggleSpookyFilter();
    setVoiceState({ ...voiceManager.state });
  };

  const handleToggleMicTest = () => {
    sound.playClick();
    voiceManager.toggleMicTest();
    setVoiceState({ ...voiceManager.state });
  };

  return (
    <div className="w-full bg-stone-900/90 backdrop-blur-md border border-amber-500/20 rounded-2xl p-3 sm:p-4 shadow-xl text-stone-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Room Status & Audio Activity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-stone-900" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-stone-100">{t.voiceRoomTitle}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {activeSpeakersCount} {t.voiceActiveCount}
              </span>
            </div>
            
            {/* Live Volume Meter Bar */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-stone-400">
                {voiceState.isMuted 
                  ? t.micMuted 
                  : (voiceState.isSpeaking ? t.speakingNow : (voiceState.hasMicPermission ? t.micActive : (lang === 'ar' ? 'انقر لتفعيل المايك' : 'Click to enable mic')))}
              </span>
              <div className="w-20 sm:w-28 h-1.5 bg-stone-800 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full transition-all duration-75 ${
                    voiceState.isMuted 
                      ? 'w-0' 
                      : (voiceState.audioLevel > 50 ? 'bg-red-500' : 'bg-emerald-400')
                  }`}
                  style={{ width: `${voiceState.isMuted ? 0 : voiceState.audioLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Voice Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Mic Toggle Button */}
          <button
            onClick={handleToggleMic}
            disabled={isInitializing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-md ${
              !voiceState.hasMicPermission
                ? 'bg-amber-600 hover:bg-amber-500 text-black font-semibold'
                : voiceState.isMuted
                ? 'bg-red-600/80 hover:bg-red-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {voiceState.isMuted || !voiceState.hasMicPermission ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4 animate-pulse" />
            )}
            <span>
              {!voiceState.hasMicPermission 
                ? (lang === 'ar' ? 'تشغيل المايك' : 'Enable Mic') 
                : (voiceState.isMuted ? (lang === 'ar' ? 'إلغاء الكتم' : 'Unmute') : (lang === 'ar' ? 'كتم المايك' : 'Mute'))}
            </span>
          </button>

          {/* Werewolf Spooky Filter */}
          <button
            onClick={handleToggleSpooky}
            title={t.spookyFilter}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-all border ${
              voiceState.isSpookyFilterActive
                ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-purple-900/50'
                : 'bg-stone-800/80 border-stone-700 hover:border-stone-500 text-stone-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">🐺 {t.spookyFilter}</span>
            <span className="sm:hidden">🐺</span>
          </button>

          {/* Mic Loopback Test */}
          <button
            onClick={handleToggleMicTest}
            title={t.testMic}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-all border ${
              voiceState.isTestingMic
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-cyan-900/50'
                : 'bg-stone-800/80 border-stone-700 hover:border-stone-500 text-stone-300'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t.testMic}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
