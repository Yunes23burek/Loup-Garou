import { Player, Language } from '../types/game';
import { ROLES_DATA, TRANSLATIONS } from '../i18n/translations';
import { Crown, Mic, MicOff, Skull, Heart } from 'lucide-react';

interface PlayerAvatarProps {
  player: Player;
  isSelf: boolean;
  canSeeRole: boolean;
  voteCount?: number;
  isSelected?: boolean;
  isSelectable?: boolean;
  onSelect?: () => void;
  lang: Language;
}

export function PlayerAvatar({
  player,
  isSelf,
  canSeeRole,
  voteCount = 0,
  isSelected = false,
  isSelectable = false,
  onSelect,
  lang
}: PlayerAvatarProps) {
  const t = TRANSLATIONS[lang];
  const roleInfo = player.role ? ROLES_DATA[player.role] : null;

  return (
    <div 
      onClick={() => isSelectable && onSelect && onSelect()}
      className={`relative flex flex-col items-center group transition-all duration-300 ${
        isSelectable ? 'cursor-pointer hover:scale-105' : ''
      }`}
    >
      {/* Outer Glow / Speaking Ripple Wave */}
      <div className="relative">
        {player.isSpeaking && player.isAlive && (
          <>
            <span className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping" />
            <span className="absolute -inset-1 rounded-full bg-emerald-400/50 animate-pulse" />
          </>
        )}

        {/* Selected target ring */}
        {isSelected && (
          <span className="absolute -inset-1.5 rounded-full border-2 border-red-500 animate-pulse" />
        )}

        {/* Main Avatar Container */}
        <div
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-xl transition-all border-2 ${
            !player.isAlive
              ? 'bg-neutral-900 border-red-900/60 grayscale opacity-60'
              : isSelected
              ? 'bg-red-950/80 border-red-500 shadow-red-900/50'
              : player.isSpeaking
              ? 'bg-emerald-950/80 border-emerald-400 shadow-emerald-900/40'
              : 'bg-stone-900 border-amber-500/30 hover:border-amber-400'
          }`}
        >
          {/* Avatar Emoji */}
          <span>{player.avatar || '🧑'}</span>

          {/* Dead Overlay Badge */}
          {!player.isAlive && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-red-500">
              <Skull className="w-7 h-7 animate-pulse" />
            </div>
          )}

          {/* Host Crown */}
          {player.isHost && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black p-0.5 rounded-full shadow-md">
              <Crown className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Mic Status Icon */}
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full text-xs shadow-md border border-black/40 bg-stone-900 text-stone-200">
            {player.isMuted ? (
              <MicOff className="w-3 h-3 text-red-400" />
            ) : (
              <Mic className={`w-3 h-3 ${player.isSpeaking ? 'text-emerald-400' : 'text-stone-400'}`} />
            )}
          </div>

          {/* Lovers Badge */}
          {player.inLoveWithId && (
            <div className="absolute -bottom-1 -left-1 p-1 rounded-full bg-pink-950 border border-pink-500 text-pink-400">
              <Heart className="w-3 h-3 fill-pink-500" />
            </div>
          )}
        </div>

        {/* Vote count counter tag */}
        {voteCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded-full border border-red-400 shadow-lg animate-bounce">
            {voteCount}
          </div>
        )}
      </div>

      {/* Player Name */}
      <div className="mt-2 text-center max-w-[90px] sm:max-w-[110px]">
        <p className="text-xs sm:text-sm font-semibold truncate text-stone-200">
          {player.name}
          {isSelf && <span className="text-[10px] text-amber-400 ms-1 font-normal">({t.youBadge})</span>}
        </p>

        {/* Role Tag (Visible if self or allowed by role e.g. werewolves see fellow wolves, or game ended) */}
        {canSeeRole && roleInfo && (
          <span 
            className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded font-medium border"
            style={{ 
              backgroundColor: `${roleInfo.color}20`, 
              color: roleInfo.color,
              borderColor: `${roleInfo.color}50` 
            }}
          >
            {roleInfo.icon} {lang === 'ar' ? roleInfo.nameAr : roleInfo.nameEn}
          </span>
        )}
      </div>
    </div>
  );
}
