import { Language } from '../types/game';
import { TRANSLATIONS, ROLES_DATA } from '../i18n/translations';
import { X, BookOpen, Shield } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export function RulesModal({ isOpen, onClose, lang }: RulesModalProps) {
  const t = TRANSLATIONS[lang];
  if (!isOpen) return null;

  const roleKeys = Object.keys(ROLES_DATA).filter(k => k !== 'unassigned') as (keyof typeof ROLES_DATA)[];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-stone-950 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative text-stone-200 my-auto">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 end-4 p-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h3 className="font-serif font-bold text-lg text-amber-200">
            {t.ruleGuideTitle}
          </h3>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          <div className="bg-stone-900/80 border border-white/5 rounded-xl p-3 text-xs leading-relaxed">
            <span className="font-bold text-amber-400 me-1">1.</span> {t.rule1}
          </div>
          <div className="bg-stone-900/80 border border-white/5 rounded-xl p-3 text-xs leading-relaxed">
            <span className="font-bold text-amber-400 me-1">2.</span> {t.rule2}
          </div>
          <div className="bg-stone-900/80 border border-white/5 rounded-xl p-3 text-xs leading-relaxed">
            <span className="font-bold text-amber-400 me-1">3.</span> {t.rule3}
          </div>
          <div className="bg-stone-900/80 border border-white/5 rounded-xl p-3 text-xs leading-relaxed">
            <span className="font-bold text-amber-400 me-1">4.</span> {t.rule4}
          </div>
        </div>

        {/* Roles Details */}
        <h4 className="text-xs font-serif font-bold text-stone-400 uppercase tracking-wider mb-3">
          {t.rolesComposition}
        </h4>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {roleKeys.map(key => {
            const r = ROLES_DATA[key];
            return (
              <div 
                key={key} 
                className="bg-stone-900/60 border border-white/5 rounded-xl p-3 flex items-start gap-3 text-xs"
              >
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0 border"
                  style={{ backgroundColor: `${r.color}20`, borderColor: `${r.color}40` }}
                >
                  {r.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif font-bold" style={{ color: r.color }}>
                      {lang === 'ar' ? r.nameAr : r.nameEn}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      ({r.team === 'werewolves' ? (lang === 'ar' ? 'فريق الذئاب' : 'Wolves') : (lang === 'ar' ? 'فريق القرية' : 'Town')})
                    </span>
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed mb-1">
                    {lang === 'ar' ? r.descriptionAr : r.descriptionEn}
                  </p>
                  <p className="text-amber-400/90 text-[10px] font-medium">
                    ⚡ {lang === 'ar' ? r.abilityAr : r.abilityEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
