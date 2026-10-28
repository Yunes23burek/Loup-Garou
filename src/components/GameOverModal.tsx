import { useEffect } from 'react';
import { Player, Language, GameRoom } from '../types/game';
import { TRANSLATIONS, ROLES_DATA } from '../i18n/translations';
import { sound } from '../audio/soundEngine';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Skull, Shield } from 'lucide-react';

interface GameOverModalProps {
  room: GameRoom;
  players: Player[];
  lang: Language;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export function GameOverModal({ room, players, lang, onPlayAgain, onReturnToLobby }: GameOverModalProps) {
  const t = TRANSLATIONS[lang];
  const isVillagersWin = room.winner === 'villagers';

  useEffect(() => {
    if (isVillagersWin) {
      sound.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      sound.playWolfHowl();
    }
  }, [isVillagersWin]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-stone-950 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ backgroundColor: isVillagersWin ? '#3b82f6' : '#ef4444' }}
        />

        {/* Victory Header */}
        <div className="text-center relative z-10 mb-6">
          <div 
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl mb-3 shadow-xl border-2"
            style={{ 
              borderColor: isVillagersWin ? '#3b82f6' : '#ef4444',
              backgroundColor: isVillagersWin ? '#1e3a8a33' : '#7f1d1d33' 
            }}
          >
            {isVillagersWin ? '🎉' : '🐺'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-black text-amber-300 mb-1">
            {isVillagersWin ? t.villagersWin : t.werewolvesWin}
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 max-w-sm mx-auto">
            {isVillagersWin ? t.villagersWinDesc : t.werewolvesWinDesc}
          </p>
        </div>

        {/* Roles Reveal Board */}
        <div className="bg-stone-900/90 border border-white/10 rounded-2xl p-4 mb-6 relative z-10">
          <h4 className="text-xs font-serif font-bold text-amber-400 uppercase tracking-wider mb-3 pb-1 border-b border-white/10">
            {lang === 'ar' ? 'كشف الهويات الحقيقية لأهل القرية' : 'True Identity Manifest'}
          </h4>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {players.map(p => {
              const r = ROLES_DATA[p.role] || ROLES_DATA.villager;
              return (
                <div 
                  key={p.uid} 
                  className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                    p.role === 'werewolf' 
                      ? 'bg-red-950/40 border-red-500/30 text-red-200' 
                      : 'bg-stone-950/60 border-white/5 text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.avatar}</span>
                    <span className="font-semibold">{p.name}</span>
                    {!p.isAlive && (
                      <span className="text-[10px] text-stone-500 flex items-center gap-0.5">
                        <Skull className="w-3 h-3 text-red-400" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 font-serif font-bold" style={{ color: r.color }}>
                    <span>{r.icon}</span>
                    <span>{lang === 'ar' ? r.nameAr : r.nameEn}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-serif font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.playAgain}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onReturnToLobby();
            }}
            className="py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-medium text-xs border border-white/10 transition-colors"
          >
            {t.returnLobby}
          </button>
        </div>
      </div>
    </div>
  );
}
