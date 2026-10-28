import { useState } from 'react';
import { Player, Language, GameRoom } from '../types/game';
import { TRANSLATIONS, ROLES_DATA } from '../i18n/translations';
import { Moon, Eye, Sparkles, Shield, Skull, HeartPulse } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface NightPhaseViewProps {
  room: GameRoom;
  currentPlayer: Player;
  players: Player[];
  lang: Language;
  onWerewolfTarget: (targetId: string) => void;
  onSeerInspect: (targetId: string) => void;
  onWitchHeal: () => void;
  onWitchPoison: (targetId: string) => void;
  onWitchPass: () => void;
  onBodyguardProtect: (targetId: string) => void;
}

export function NightPhaseView({
  room,
  currentPlayer,
  players,
  lang,
  onWerewolfTarget,
  onSeerInspect,
  onWitchHeal,
  onWitchPoison,
  onWitchPass,
  onBodyguardProtect
}: NightPhaseViewProps) {
  const t = TRANSLATIONS[lang];
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  const [selectedPreyId, setSelectedPreyId] = useState<string | null>(null);
  const [witchPoisonTargetId, setWitchPoisonTargetId] = useState<string | null>(null);

  const livingPlayers = players.filter(p => p.isAlive);
  const livingNonWolves = livingPlayers.filter(p => p.role !== 'werewolf');
  const otherLivingPlayers = livingPlayers.filter(p => p.uid !== currentPlayer.uid);
  const nightVictim = players.find(p => p.uid === room.nightVictimId);

  // Werewolf view
  if (currentPlayer.role === 'werewolf' && currentPlayer.isAlive) {
    return (
      <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2 mb-3 text-red-400">
          <span className="text-2xl">🐺</span>
          <h3 className="font-serif font-bold text-lg text-red-300">
            {lang === 'ar' ? 'اجتماع المستذئبين السري' : 'Werewolf Secret Pack Hunt'}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-300 mb-4">
          {t.nightAttackTarget}
        </p>

        {/* Targets grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {livingNonWolves.map(player => {
            const isTargeted = selectedPreyId === player.uid || room.nightVictimId === player.uid;
            return (
              <button
                key={player.uid}
                onClick={() => {
                  sound.playClick();
                  setSelectedPreyId(player.uid);
                  onWerewolfTarget(player.uid);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center transition-all ${
                  isTargeted 
                    ? 'bg-red-900/80 border-red-500 text-white shadow-lg shadow-red-950 scale-105' 
                    : 'bg-stone-900/80 border-white/10 hover:border-red-400/50 text-stone-200'
                }`}
              >
                <span className="text-3xl mb-1">{player.avatar}</span>
                <span className="text-xs font-semibold truncate max-w-full">{player.name}</span>
                {isTargeted && (
                  <span className="text-[10px] text-red-300 mt-1 flex items-center gap-1 font-bold">
                    <Skull className="w-3 h-3" /> {lang === 'ar' ? 'الضحية' : 'Prey'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Seer view
  if (currentPlayer.role === 'seer' && currentPlayer.isAlive) {
    return (
      <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2 mb-3 text-purple-400">
          <span className="text-2xl">🔮</span>
          <h3 className="font-serif font-bold text-lg text-purple-200">
            {lang === 'ar' ? 'بلورة العرافة السحرية' : 'The Seer’s Scrying Orb'}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-300 mb-4">
          {t.seerInspectTarget}
        </p>

        {inspectedPlayer ? (
          <div className="bg-purple-900/60 border border-purple-400 rounded-2xl p-4 text-center max-w-sm mx-auto animate-fadeIn">
            <Sparkles className="w-6 h-6 text-purple-300 mx-auto mb-2 animate-bounce" />
            <p className="text-xs text-purple-300 mb-1">{lang === 'ar' ? 'كشفت البلورة دور:' : 'The Orb reveals the truth of:'}</p>
            <p className="font-serif font-bold text-base text-white mb-2">{inspectedPlayer.name}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-purple-400 text-sm font-semibold text-purple-200">
              <span>{ROLES_DATA[inspectedPlayer.role]?.icon}</span>
              <span>{lang === 'ar' ? ROLES_DATA[inspectedPlayer.role]?.nameAr : ROLES_DATA[inspectedPlayer.role]?.nameEn}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {otherLivingPlayers.map(player => (
              <button
                key={player.uid}
                onClick={() => {
                  sound.playMysticalChime();
                  setInspectedPlayer(player);
                  onSeerInspect(player.uid);
                }}
                className="p-3 rounded-xl border bg-stone-900/80 border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/50 text-stone-200 flex flex-col items-center transition-all group"
              >
                <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{player.avatar}</span>
                <span className="text-xs font-semibold truncate max-w-full">{player.name}</span>
                <span className="text-[10px] text-purple-400 mt-1 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {lang === 'ar' ? 'كشف الهوية' : 'Inspect'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Witch view
  if (currentPlayer.role === 'witch' && currentPlayer.isAlive) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2 mb-3 text-emerald-400">
          <span className="text-2xl">🧙‍♀️</span>
          <h3 className="font-serif font-bold text-lg text-emerald-200">
            {lang === 'ar' ? 'خيمة الساحرة وجرعاتها' : 'The Witch’s Potion Shack'}
          </h3>
        </div>

        {/* Night Victim Info */}
        <div className="bg-stone-900/80 border border-white/10 rounded-xl p-3 mb-4 text-xs sm:text-sm text-stone-300">
          <p>
            {t.witchVictimInfo}:{' '}
            <span className="font-bold text-amber-300">
              {nightVictim ? nightVictim.name : (lang === 'ar' ? 'لم يهاجم الذئاب أحداً بعد' : 'No victim chosen yet')}
            </span>
          </p>
        </div>

        {/* Potion Actions */}
        <div className="flex flex-wrap gap-2.5 mb-4">
          {nightVictim && !room.witchPotionHealUsed && (
            <button
              onClick={() => {
                sound.playPotionBubble();
                onWitchHeal();
              }}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md"
            >
              <HeartPulse className="w-4 h-4" />
              <span>{t.witchUseHeal}</span>
            </button>
          )}

          {!room.witchPotionPoisonUsed && (
            <button
              onClick={() => {
                sound.playClick();
                setWitchPoisonTargetId(witchPoisonTargetId ? null : otherLivingPlayers[0]?.uid || null);
              }}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs transition-all shadow-md"
            >
              <Skull className="w-4 h-4" />
              <span>{t.witchUsePoison}</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onWitchPass();
            }}
            className="flex-1 min-w-[150px] py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs transition-colors"
          >
            {t.witchPass}
          </button>
        </div>

        {/* Poison target selector if poison activated */}
        {witchPoisonTargetId && !room.witchPotionPoisonUsed && (
          <div className="mt-3 p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl">
            <p className="text-xs text-purple-200 mb-2 font-medium">
              {lang === 'ar' ? 'حدد الضحية التي تريد سكب السم عليها:' : 'Select who receives the lethal poison brew:'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {otherLivingPlayers.map(p => (
                <button
                  key={p.uid}
                  onClick={() => {
                    sound.playPotionBubble();
                    onWitchPoison(p.uid);
                    setWitchPoisonTargetId(null);
                  }}
                  className="p-2 rounded-lg bg-stone-900 hover:bg-red-950 text-xs text-stone-200 hover:text-red-200 border border-white/10"
                >
                  {p.avatar} {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Bodyguard view
  if (currentPlayer.role === 'bodyguard' && currentPlayer.isAlive) {
    return (
      <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2 mb-3 text-cyan-400">
          <Shield className="w-6 h-6" />
          <h3 className="font-serif font-bold text-lg text-cyan-200">
            {lang === 'ar' ? 'حماية الحارس الشخصي' : 'Bodyguard Protection'}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-300 mb-4">
          {lang === 'ar' ? 'اختر قروياً لترابط أمام بيته وتحميه من هجمات المستذئبين الليلة:' : 'Choose a resident to shield against attacks tonight:'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {livingPlayers.map(player => (
            <button
              key={player.uid}
              onClick={() => {
                sound.playClick();
                onBodyguardProtect(player.uid);
              }}
              className="p-3 rounded-xl border bg-stone-900/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/50 text-stone-200 flex flex-col items-center transition-all"
            >
              <span className="text-3xl mb-1">{player.avatar}</span>
              <span className="text-xs font-semibold truncate max-w-full">{player.name}</span>
              <span className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3" /> {lang === 'ar' ? 'حماية' : 'Protect'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Sleeping Villager or Spectator View
  return (
    <div className="bg-stone-950/60 border border-blue-900/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl text-center">
      <div className="w-16 h-16 rounded-full bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-amber-300 text-3xl mx-auto mb-4 animate-pulse">
        <Moon className="w-8 h-8 text-blue-300" />
      </div>
      <h3 className="font-serif font-bold text-lg sm:text-xl text-blue-200 mb-2">
        {t.phaseNightStart}
      </h3>
      <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
        {lang === 'ar' 
          ? 'تنام نوماً هادئاً في كوخك الخشبي، بينما تتحرك الأرواح والوحوش في الظلام... انتظر بزوغ الفجر.'
          : 'You rest peacefully inside your cabin while dark creatures roam the village... Await the break of dawn.'}
      </p>
    </div>
  );
}
