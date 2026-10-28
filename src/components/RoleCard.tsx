import { useState } from 'react';
import { RoleType, Language } from '../types/game';
import { ROLES_DATA, TRANSLATIONS } from '../i18n/translations';
import { Eye, EyeOff, Shield, Sparkles } from 'lucide-react';

interface RoleCardProps {
  role: RoleType;
  lang: Language;
  defaultRevealed?: boolean;
}

export function RoleCard({ role, lang, defaultRevealed = false }: RoleCardProps) {
  const [isRevealed, setIsRevealed] = useState(defaultRevealed);
  const roleInfo = ROLES_DATA[role] || ROLES_DATA.unassigned;
  const t = TRANSLATIONS[lang];

  return (
    <div className="relative w-full max-w-xs mx-auto">
      <div 
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 shadow-2xl p-5 ${
          isRevealed 
            ? 'border-amber-500/60 bg-gradient-to-b from-stone-900 via-neutral-900 to-black text-white' 
            : 'border-slate-700 bg-stone-950 text-slate-300'
        }`}
      >
        {/* Decorative medieval corner accents */}
        <div className="absolute top-2 left-2 text-amber-500/40 text-xs font-serif">✦</div>
        <div className="absolute top-2 right-2 text-amber-500/40 text-xs font-serif">✦</div>
        <div className="absolute bottom-2 left-2 text-amber-500/40 text-xs font-serif">✦</div>
        <div className="absolute bottom-2 right-2 text-amber-500/40 text-xs font-serif">✦</div>

        {/* Header with reveal toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold tracking-wider uppercase text-amber-400 font-serif">
              {t.yourSecretRole}
            </span>
          </div>
          <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-200"
          >
            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isRevealed ? t.hideRole : t.showRole}</span>
          </button>
        </div>

        {/* Card Body */}
        {isRevealed ? (
          <div className="flex flex-col items-center text-center animate-fadeIn">
            {/* Role Icon Avatar */}
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg mb-3 border-2 border-amber-400/40 bg-radial from-amber-500/20 to-transparent"
              style={{ backgroundColor: `${roleInfo.color}22` }}
            >
              <span>{roleInfo.icon}</span>
            </div>

            {/* Role Name */}
            <h3 className="text-xl font-bold font-serif text-amber-300 mb-1">
              {lang === 'ar' ? roleInfo.nameAr : roleInfo.nameEn}
            </h3>

            {/* Team Badge */}
            <div className="mb-3">
              <span 
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  roleInfo.team === 'werewolves' 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                    : roleInfo.team === 'neutral'
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}
              >
                {lang === 'ar' 
                  ? (roleInfo.team === 'werewolves' ? 'فريق المستذئبين' : roleInfo.team === 'neutral' ? 'محايد' : 'فريق أهل القرية') 
                  : (roleInfo.team === 'werewolves' ? 'Werewolves Team' : roleInfo.team === 'neutral' ? 'Neutral' : 'Villagers Team')}
              </span>
            </div>

            {/* Lore & Ability */}
            <p className="text-xs text-stone-300 leading-relaxed mb-3">
              {lang === 'ar' ? roleInfo.descriptionAr : roleInfo.descriptionEn}
            </p>

            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-start">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'القدرة الخاصة' : 'Special Power'}</span>
              </div>
              <p className="text-[11px] text-stone-300">
                {lang === 'ar' ? roleInfo.abilityAr : roleInfo.abilityEn}
              </p>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsRevealed(true)}
            className="flex flex-col items-center justify-center py-10 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full border border-dashed border-amber-500/40 flex items-center justify-center text-amber-400/60 group-hover:scale-110 group-hover:text-amber-400 group-hover:border-amber-400 transition-all mb-3 bg-amber-950/20">
              <Eye className="w-7 h-7" />
            </div>
            <p className="text-sm font-serif font-medium text-amber-400/80 group-hover:text-amber-300">
              {t.showRole}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              {lang === 'ar' ? 'اضغط لعرض دورك السري بأمان' : 'Click to peek at your secret identity'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
