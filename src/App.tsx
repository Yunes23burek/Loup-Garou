import { useState, useEffect, useRef } from 'react';
import { 
  Player, 
  GameRoom, 
  GamePhase, 
  Language, 
  GameMessage,
  RoleType 
} from './types/game';
import { TRANSLATIONS } from './i18n/translations';
import { sound } from './audio/soundEngine';
import { voiceManager } from './audio/voiceManager';
import { distributeRoles, checkVictoryCondition } from './utils/gameRules';
import { generateRandomBot, generateBotDayDialogue } from './utils/botAi';
import { ensureAuthUser, testConnection } from './firebase';

// Components
import { Navbar } from './components/Navbar';
import { LobbyView } from './components/LobbyView';
import { RoleCard } from './components/RoleCard';
import { PlayerAvatar } from './components/PlayerAvatar';
import { VoiceRoomBar } from './components/VoiceRoomBar';
import { ChatBox } from './components/ChatBox';
import { NightPhaseView } from './components/NightPhaseView';
import { VotingPhaseView } from './components/VotingPhaseView';
import { GameOverModal } from './components/GameOverModal';
import { RulesModal } from './components/RulesModal';
import { GitHubFirebaseModal } from './components/GitHubFirebaseModal';

import { 
  Moon, 
  Sun, 
  Vote, 
  Volume2, 
  Users, 
  ShieldAlert, 
  Play, 
  Sparkles,
  ArrowRight,
  Crosshair,
  Skull
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const t = TRANSLATIONS[lang];

  // Auth User
  const [currentUserId, setCurrentUserId] = useState<string>('local_player_1');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  // Active Game State
  const [room, setRoom] = useState<GameRoom>({
    id: 'room_1',
    code: 'WOLF8',
    hostId: 'local_player_1',
    hostName: 'فارس الحكيم',
    name: 'قرية المستذئبين',
    status: 'lobby',
    phase: 'lobby',
    round: 1,
    language: 'ar',
    timer: 30,
    maxPlayers: 10,
    winner: 'none'
  });

  // Current Player
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    uid: 'local_player_1',
    name: 'فارس الحكيم',
    avatar: '🧔',
    role: 'unassigned',
    isAlive: true,
    isHost: true,
    isBot: false,
    isMuted: false,
    isSpeaking: false,
    joinedAt: Date.now()
  });

  // All Players in room (Default with a couple friendly villagers ready)
  const [players, setPlayers] = useState<Player[]>([
    {
      uid: 'local_player_1',
      name: 'فارس الحكيم',
      avatar: '🧔',
      role: 'unassigned',
      isAlive: true,
      isHost: true,
      isBot: false,
      isMuted: false,
      isSpeaking: false,
      joinedAt: Date.now()
    },
    {
      uid: 'bot_1',
      name: 'ليلى الخياطة',
      avatar: '👩‍🦰',
      role: 'unassigned',
      isAlive: true,
      isHost: false,
      isBot: true,
      isMuted: false,
      isSpeaking: false,
      joinedAt: Date.now() + 1
    },
    {
      uid: 'bot_2',
      name: 'عمر الحداد',
      avatar: '👨‍🦳',
      role: 'unassigned',
      isAlive: true,
      isHost: false,
      isBot: true,
      isMuted: false,
      isSpeaking: false,
      joinedAt: Date.now() + 2
    },
    {
      uid: 'bot_3',
      name: 'سارة العشابة',
      avatar: '👩‍🌾',
      role: 'unassigned',
      isAlive: true,
      isHost: false,
      isBot: true,
      isMuted: false,
      isSpeaking: false,
      joinedAt: Date.now() + 3
    },
    {
      uid: 'bot_4',
      name: 'يوسف الحطاب',
      avatar: '🧔‍♂️',
      role: 'unassigned',
      isAlive: true,
      isHost: false,
      isBot: true,
      isMuted: false,
      isSpeaking: false,
      joinedAt: Date.now() + 4
    }
  ]);

  // Messages log
  const [messages, setMessages] = useState<GameMessage[]>([
    {
      senderId: 'system',
      senderName: 'الراوي',
      text: 'مرحباً بكم في قرية ثيرسيليو! المستذئبون يتربصون بيننا...',
      type: 'system',
      timestamp: Date.now()
    }
  ]);

  // Hunter Revenge Target Modal State
  const [hunterPendingPlayer, setHunterPendingPlayer] = useState<Player | null>(null);

  // Initialize Firebase Auth & Connection
  useEffect(() => {
    testConnection();
    ensureAuthUser().then(user => {
      setCurrentUserId(user.uid);
      setCurrentPlayer(prev => ({ ...prev, uid: user.uid }));
      setRoom(prev => ({ ...prev, hostId: user.uid }));
      setPlayers(prev => prev.map(p => p.isHost ? { ...p, uid: user.uid } : p));
    }).catch(err => {
      console.warn('Auth offline fallback:', err);
    });
  }, []);

  // Sync language with room
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setRoom(prev => ({ ...prev, language: newLang }));
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLang);
  };

  // Add a Bot to fill room
  const handleAddBot = () => {
    const existingNames = players.map(p => p.name);
    const newBot = generateRandomBot(existingNames, lang) as Player;
    setPlayers(prev => [...prev, newBot]);
    addSystemMessage(
      lang === 'ar' ? `دخل القروي ${newBot.name} إلى الردهة` : `${newBot.name} entered the village square`
    );
  };

  const handleRemovePlayer = (uid: string) => {
    setPlayers(prev => prev.filter(p => p.uid !== uid));
  };

  const handleUpdateProfile = (name: string, avatar: string) => {
    setCurrentPlayer(prev => ({ ...prev, name, avatar }));
    setPlayers(prev => prev.map(p => p.uid === currentPlayer.uid ? { ...p, name, avatar } : p));
  };

  const addSystemMessage = (text: string, type: 'system' | 'narrator' | 'night' | 'elimination' = 'system') => {
    setMessages(prev => [
      ...prev,
      {
        senderId: 'narrator',
        senderName: lang === 'ar' ? 'الراوي' : 'Narrator',
        text,
        type,
        timestamp: Date.now()
      }
    ]);
  };

  const handleSendMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        senderId: currentPlayer.uid,
        senderName: currentPlayer.name,
        text,
        type: 'chat',
        timestamp: Date.now()
      }
    ]);
  };

  // Start the Game: Distribute roles & start Night 1
  const handleStartGame = () => {
    if (players.length < 4) return;
    const assigned = distributeRoles(players);
    setPlayers(assigned);

    const me = assigned.find(p => p.uid === currentPlayer.uid);
    if (me) {
      setCurrentPlayer(me);
    }

    setRoom(prev => ({
      ...prev,
      status: 'in_game',
      phase: 'night_start',
      round: 1,
      nightVictimId: null,
      witchSaved: false,
      witchPoisonedId: null,
      seerCheckedId: null,
      bodyguardProtectedId: null,
      lastEliminated: null
    }));

    sound.playWolfHowl();
    addSystemMessage(
      lang === 'ar' 
        ? 'أُسدلت خيوط الليل، وأغلقت القرية أبوابها وسكن الجميع... ناموا أيها القرويون!' 
        : 'Night settles upon the village. Close your shutters and sleep tight, villagers!',
      'night'
    );

    // Auto advance through night steps
    setTimeout(() => {
      advanceNightStep('werewolves', assigned);
    }, 2800);
  };

  // Night sub-phases
  const advanceNightStep = (nextPhase: GamePhase, currentList: Player[]) => {
    setRoom(prev => ({ ...prev, phase: nextPhase }));

    if (nextPhase === 'werewolves') {
      addSystemMessage(
        lang === 'ar' ? 'استيقظ المستذئبون في الظلام لتحديد فريستهم...' : 'Werewolves awaken in silence to pick their victim...',
        'night'
      );
      // If player is not werewolf, simulate bot werewolf hunt after 5s
      const wolves = currentList.filter(p => p.role === 'werewolf' && p.isAlive);
      const isPlayerWolf = wolves.some(w => w.uid === currentPlayer.uid);
      if (!isPlayerWolf) {
        setTimeout(() => {
          const livingNonWolves = currentList.filter(p => p.role !== 'werewolf' && p.isAlive);
          if (livingNonWolves.length > 0) {
            const victim = livingNonWolves[Math.floor(Math.random() * livingNonWolves.length)];
            setRoom(r => ({ ...r, nightVictimId: victim.uid }));
          }
          advanceNightStep('seer', currentList);
        }, 3500);
      }
    } else if (nextPhase === 'seer') {
      const seerAlive = currentList.some(p => p.role === 'seer' && p.isAlive);
      if (seerAlive) {
        addSystemMessage(
          lang === 'ar' ? 'تستيقظ العرافة وتتأمل في بلورتها السحرية...' : 'The Seer opens her eyes and gazes into her crystal orb...',
          'night'
        );
        const isPlayerSeer = currentPlayer.role === 'seer' && currentPlayer.isAlive;
        if (!isPlayerSeer) {
          setTimeout(() => advanceNightStep('witch', currentList), 3000);
        }
      } else {
        advanceNightStep('witch', currentList);
      }
    } else if (nextPhase === 'witch') {
      const witchAlive = currentList.some(p => p.role === 'witch' && p.isAlive);
      if (witchAlive) {
        addSystemMessage(
          lang === 'ar' ? 'تستيقظ الساحرة لتتفقد جرعاتها السحرية...' : 'The Witch inspects her bubbling cauldrons and potions...',
          'night'
        );
        const isPlayerWitch = currentPlayer.role === 'witch' && currentPlayer.isAlive;
        if (!isPlayerWitch) {
          setTimeout(() => advanceNightStep('day_sunrise', currentList), 3000);
        }
      } else {
        advanceNightStep('day_sunrise', currentList);
      }
    } else if (nextPhase === 'day_sunrise') {
      handleSunrise(currentList);
    }
  };

  // Werewolf target action
  const handleWerewolfTarget = (victimId: string) => {
    setRoom(prev => ({ ...prev, nightVictimId: victimId }));
    setTimeout(() => {
      advanceNightStep('seer', players);
    }, 1500);
  };

  // Seer inspect action
  const handleSeerInspect = (targetId: string) => {
    setRoom(prev => ({ ...prev, seerCheckedId: targetId }));
    setTimeout(() => {
      advanceNightStep('witch', players);
    }, 2500);
  };

  // Witch actions
  const handleWitchHeal = () => {
    setRoom(prev => ({ ...prev, witchSaved: true, witchPotionHealUsed: true }));
    setTimeout(() => {
      advanceNightStep('day_sunrise', players);
    }, 1500);
  };

  const handleWitchPoison = (targetId: string) => {
    setRoom(prev => ({ ...prev, witchPoisonedId: targetId, witchPotionPoisonUsed: true }));
    setTimeout(() => {
      advanceNightStep('day_sunrise', players);
    }, 1500);
  };

  const handleWitchPass = () => {
    setTimeout(() => {
      advanceNightStep('day_sunrise', players);
    }, 500);
  };

  const handleBodyguardProtect = (targetId: string) => {
    setRoom(prev => ({ ...prev, bodyguardProtectedId: targetId }));
    setTimeout(() => {
      advanceNightStep('day_sunrise', players);
    }, 1500);
  };

  // Dawn & Morning Phase
  const handleSunrise = (currentList: Player[]) => {
    sound.playDawnCrow();
    setTimeout(() => sound.playChurchBell(), 900);

    setRoom(prev => ({ ...prev, phase: 'day_sunrise' }));

    // Evaluate night casualties
    let updatedPlayers = [...currentList];
    const victimId = room.nightVictimId;
    const isSavedByWitch = room.witchSaved;
    const isProtectedByGuard = victimId === room.bodyguardProtectedId;
    const poisonedId = room.witchPoisonedId;

    const casualties: Player[] = [];

    if (victimId && !isSavedByWitch && !isProtectedByGuard) {
      const v = updatedPlayers.find(p => p.uid === victimId);
      if (v) casualties.push(v);
    }

    if (poisonedId) {
      const p = updatedPlayers.find(p => p.uid === poisonedId);
      if (p && !casualties.some(c => c.uid === p.uid)) {
        casualties.push(p);
      }
    }

    // Mark as dead
    casualties.forEach(c => {
      updatedPlayers = updatedPlayers.map(p => p.uid === c.uid ? { ...p, isAlive: false } : p);
    });

    setPlayers(updatedPlayers);
    const updatedSelf = updatedPlayers.find(p => p.uid === currentPlayer.uid);
    if (updatedSelf) setCurrentPlayer(updatedSelf);

    // Announce in chronicle
    if (casualties.length === 0) {
      addSystemMessage(
        lang === 'ar' 
          ? 'أشرقت الشمس على القرية دون أن يُقتل أحد! كانت الليلة آمنة بفضل الحماية أو جرعة الساحرة.' 
          : 'Dawn breaks! Miraculously, nobody was killed during the night.',
        'narrator'
      );
    } else {
      casualties.forEach(c => {
        addSystemMessage(
          lang === 'ar' 
            ? `عثر أهل القرية على جثة ${c.name} عند أطراف الغابة! كان دوره (${t.alive})` 
            : `The village discovered the remains of ${c.name}!`,
          'elimination'
        );
      });
    }

    // Check Victory
    const winner = checkVictoryCondition(updatedPlayers);
    if (winner) {
      setTimeout(() => {
        setRoom(r => ({ ...r, phase: 'game_over', winner }));
      }, 2000);
      return;
    }

    // Transition to Day Discussion
    setTimeout(() => {
      setRoom(r => ({ ...r, phase: 'day_discussion' }));
      addSystemMessage(
        lang === 'ar' 
          ? 'بدأ النقاش الصباحي! استخدموا المايكروفون والدردشة لتبادل الشكوك والآراء.' 
          : 'Morning discussion begins! Use the voice room and chat to share your suspicions.',
        'narrator'
      );

      // Trigger realistic bot dialogue after a few seconds
      simulateBotMorningDebate(updatedPlayers);
    }, 3000);
  };

  // Bot Morning Arguments Simulation
  const simulateBotMorningDebate = (currentList: Player[]) => {
    const aliveBots = currentList.filter(p => p.isBot && p.isAlive);
    if (aliveBots.length === 0) return;

    aliveBots.slice(0, 3).forEach((bot, index) => {
      setTimeout(() => {
        const { text } = generateBotDayDialogue(bot, currentList.filter(p => p.isAlive), lang);
        // Show speaking animation on avatar
        setPlayers(prev => prev.map(p => p.uid === bot.uid ? { ...p, isSpeaking: true } : p));
        
        setMessages(prev => [
          ...prev,
          {
            senderId: bot.uid,
            senderName: bot.name,
            text,
            type: 'chat',
            timestamp: Date.now()
          }
        ]);

        // Stop speaking animation after 2.5s
        setTimeout(() => {
          setPlayers(prev => prev.map(p => p.uid === bot.uid ? { ...p, isSpeaking: false } : p));
        }, 2200);
      }, (index + 1) * 2600);
    });
  };

  // Move to Public Town Square Voting
  const handleStartVoting = () => {
    sound.playHeartbeat();
    setRoom(prev => ({ ...prev, phase: 'voting' }));
    addSystemMessage(
      lang === 'ar' 
        ? 'انتهى وقت النقاش! دعت أجراس الكنيسة الجميع إلى ساحة القرية للتصويت العلني.' 
        : 'Discussion time is over! Church bells summon everyone to town square for public trial.',
      'narrator'
    );

    // Living bots vote after 3 seconds
    setTimeout(() => {
      simulateBotVotes();
    }, 2800);
  };

  // Bot Votes Logic
  const simulateBotVotes = () => {
    setPlayers(prev => {
      const alivePlayers = prev.filter(p => p.isAlive);
      return prev.map(p => {
        if (p.isBot && p.isAlive) {
          const suspects = alivePlayers.filter(target => target.uid !== p.uid);
          const picked = suspects[Math.floor(Math.random() * suspects.length)];
          return { ...p, voteTargetId: picked ? picked.uid : null };
        }
        return p;
      });
    });
  };

  // Cast player vote
  const handleCastVote = (targetId: string | null) => {
    setPlayers(prev => prev.map(p => p.uid === currentPlayer.uid ? { ...p, voteTargetId: targetId } : p));
  };

  // Conclude voting and execute condemned player
  const handleConcludeVoting = () => {
    sound.playGavel();

    // Tally votes
    const tallies: Record<string, number> = {};
    players.forEach(p => {
      if (p.isAlive && p.voteTargetId) {
        tallies[p.voteTargetId] = (tallies[p.voteTargetId] || 0) + 1;
      }
    });

    let highestTargetId: string | null = null;
    let maxVotes = 0;
    Object.entries(tallies).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        highestTargetId = id;
      }
    });

    if (highestTargetId && maxVotes > 0) {
      const condemned = players.find(p => p.uid === highestTargetId);
      if (condemned) {
        const nextList = players.map(p => p.uid === condemned.uid ? { ...p, isAlive: false } : p);
        setPlayers(nextList);

        if (condemned.uid === currentPlayer.uid) {
          setCurrentPlayer(prev => ({ ...prev, isAlive: false }));
        }

        addSystemMessage(
          lang === 'ar' 
            ? `قررت القرية شنق ${condemned.name} بعد حصوله على ${maxVotes} أصوات! كشفت هويته أنه كان (${condemned.role}).` 
            : `The village sentenced ${condemned.name} to hang with ${maxVotes} votes! Their identity was (${condemned.role}).`,
          'elimination'
        );

        // Hunter final shot check
        if (condemned.role === 'hunter') {
          setHunterPendingPlayer(condemned);
          addSystemMessage(
            lang === 'ar' 
              ? `صاح الصياد ${condemned.name}: لن أموت وحدي! وجه بندقيته ليطلق رصاصته الأخيرة...` 
              : `The Hunter ${condemned.name} raises his rifle to take someone down with him!`,
            'narrator'
          );
        }

        // Check Victory
        const winner = checkVictoryCondition(nextList);
        if (winner) {
          setRoom(r => ({ ...r, phase: 'game_over', winner }));
          return;
        }
      }
    } else {
      addSystemMessage(
        lang === 'ar' ? 'تعادلت الأصوات أو امتنع الجميع عن التصويت! لم يُعدم أحد اليوم.' : 'No majority reached or votes tied! Nobody was executed today.',
        'narrator'
      );
    }

    // Move to next Night
    setTimeout(() => {
      setPlayers(prev => prev.map(p => ({ ...p, voteTargetId: null, nightTargetId: null })));
      setRoom(prev => ({
        ...prev,
        round: prev.round + 1,
        phase: 'night_start',
        nightVictimId: null,
        witchSaved: false
      }));
      sound.playWolfHowl();
      addSystemMessage(
        lang === 'ar' ? `حل الليل للجولة ${room.round + 1}... عاد الذئاب للتسلل!` : `Night falls for Round ${room.round + 1}...`,
        'night'
      );

      setTimeout(() => advanceNightStep('werewolves', players), 3000);
    }, 3500);
  };

  // Reset & Play Again
  const handlePlayAgain = () => {
    setPlayers(prev => prev.map(p => ({
      ...p,
      isAlive: true,
      role: 'unassigned',
      voteTargetId: null,
      nightTargetId: null
    })));
    setCurrentPlayer(prev => ({ ...prev, isAlive: true, role: 'unassigned' }));
    setRoom(prev => ({
      ...prev,
      phase: 'lobby',
      round: 1,
      status: 'lobby',
      winner: 'none'
    }));
    sound.playClick();
  };

  return (
    <div className={`min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black ${lang === 'ar' ? 'font-arabic' : ''}`}>
      {/* Top Navbar */}
      <Navbar
        lang={lang}
        onLanguageChange={handleLanguageChange}
        roomCode={room.code}
        phase={room.phase}
        round={room.round}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-5">
        {/* LOBBY VIEW */}
        {room.phase === 'lobby' ? (
          <LobbyView
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            onUpdatePlayer={handleUpdateProfile}
            onAddBot={handleAddBot}
            onRemovePlayer={handleRemovePlayer}
            onStartGame={handleStartGame}
            lang={lang}
          />
        ) : (
          /* ACTIVE IN-GAME VIEW */
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-5">
            {/* Center / Left 2-Cols: Playfield */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Interactive Voice Room Bar */}
              <VoiceRoomBar 
                lang={lang} 
                activeSpeakersCount={players.filter(p => p.isSpeaking).length || 1}
              />

              {/* Game Phase Banner / Status Bar */}
              <div className="bg-stone-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl text-amber-300">
                    {room.phase.includes('night') || room.phase === 'werewolves' || room.phase === 'seer' || room.phase === 'witch' ? (
                      <Moon className="w-5 h-5 text-blue-300 animate-pulse" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif font-black text-sm sm:text-base text-amber-300">
                      {room.phase === 'night_start' && t.phaseNightStart}
                      {room.phase === 'werewolves' && t.phaseWerewolves}
                      {room.phase === 'seer' && t.phaseSeer}
                      {room.phase === 'witch' && t.phaseWitch}
                      {room.phase === 'day_sunrise' && t.phaseSunrise}
                      {room.phase === 'day_discussion' && t.phaseDayTalk}
                      {room.phase === 'voting' && t.phaseVoting}
                      {room.phase === 'verdict' && t.phaseVerdict}
                    </h2>
                    <p className="text-xs text-stone-400">
                      {lang === 'ar' ? `الجولة ${room.round} · ${players.filter(p => p.isAlive).length} أحياء` : `Round ${room.round} · ${players.filter(p => p.isAlive).length} Alive`}
                    </p>
                  </div>
                </div>

                {/* Day Controls */}
                {room.phase === 'day_discussion' && currentPlayer.isHost && (
                  <button
                    onClick={handleStartVoting}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-serif font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-950"
                  >
                    <Vote className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'الانتقال للتصويت العلني ⚖️' : 'Call for Votes ⚖️'}</span>
                  </button>
                )}

                {/* Voting Execution Button */}
                {room.phase === 'voting' && currentPlayer.isHost && (
                  <button
                    onClick={handleConcludeVoting}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-serif font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <span>{lang === 'ar' ? 'حسم التصويت وتنفيذ الحكم ⚔️' : 'Resolve Votes ⚔️'}</span>
                  </button>
                )}
              </div>

                {/* Dynamic Phase Canvas */}
              {(room.phase === 'night_start' || room.phase === 'werewolves' || room.phase === 'seer' || room.phase === 'witch') && (
                <NightPhaseView
                  room={room}
                  currentPlayer={currentPlayer}
                  players={players}
                  lang={lang}
                  onWerewolfTarget={handleWerewolfTarget}
                  onSeerInspect={handleSeerInspect}
                  onWitchHeal={handleWitchHeal}
                  onWitchPoison={handleWitchPoison}
                  onWitchPass={handleWitchPass}
                  onBodyguardProtect={handleBodyguardProtect}
                />
              )}

              {room.phase === 'voting' && (
                <VotingPhaseView
                  players={players}
                  currentPlayer={currentPlayer}
                  onCastVote={handleCastVote}
                  lang={lang}
                />
              )}

              {/* Village Square Living Circle */}
              {(room.phase === 'day_discussion' || room.phase === 'day_sunrise') && (
                <div className="bg-stone-950/70 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <h3 className="font-serif font-bold text-sm sm:text-base text-stone-200">
                        {lang === 'ar' ? 'ساحة القرية وأهلها' : 'Town Square Villagers'}
                      </h3>
                    </div>
                    <span className="text-xs text-stone-400">
                      {players.filter(p => p.isAlive).length} / {players.length} {t.alive}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {players.map(player => (
                      <PlayerAvatar
                        key={player.uid}
                        player={player}
                        isSelf={player.uid === currentPlayer.uid}
                        canSeeRole={player.uid === currentPlayer.uid || !player.isAlive || (currentPlayer.role === 'werewolf' && player.role === 'werewolf')}
                        lang={lang}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Secret Role Card + Live Chat & Chronicle */}
            <div className="flex flex-col gap-4">
              {/* My Secret Role Card */}
              <RoleCard
                role={currentPlayer.role}
                lang={lang}
                defaultRevealed={false}
              />

              {/* Live Village Chat & Chronicle */}
              <div className="h-80 sm:h-96">
                <ChatBox
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  lang={lang}
                  currentPlayer={currentPlayer}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Game Over Modal */}
      {room.phase === 'game_over' && (
        <GameOverModal
          room={room}
          players={players}
          lang={lang}
          onPlayAgain={handlePlayAgain}
          onReturnToLobby={() => setRoom(r => ({ ...r, phase: 'lobby' }))}
        />
      )}

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        lang={lang}
      />

      {/* GitHub & Firebase Deployment Hub Modal */}
      <GitHubFirebaseModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
