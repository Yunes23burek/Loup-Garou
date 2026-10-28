import { Language, GamePhase } from '../types/game';
import { TRANSLATIONS } from '../i18n/translations';
import { sound } from '../audio/soundEngine';
import { 
  Moon, 
  Volume2, 
  VolumeX, 
  Globe, 
  Copy, 
  Check, 
  BookOpen, 
  Github, 
  Flame 
} from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  roomCode?: string;
  phase: GamePhase;
  round: number;
  onOpenRules: () => void;
  onOpenDeployModal: () => void;
  onLeaveRoom?: () => void;
}

export function Navbar({
  lang,
  onLanguageChange,
  roomCode,
  phase,
  round,
  onOpenRules,
  onOpenDeployModal,
  onLeaveRoom
}: NavbarProps) {
  const t = TRANSLATIONS[lang];
  const [isCopied, setIsCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    sound.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const toggleLanguage = () => {
    sound.playClick();
    onLanguageChange(lang === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="w-full bg-stone-950/80 backdrop-blur-md border-b border-amber-500/20 sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-950 via-stone-900 to-amber-950 border border-amber-500/40 flex items-center justify-center text-xl shadow-lg">
            <span>🐺</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-sm sm:text-base tracking-wide text-amber-300">
                {t.title}
              </h1>
              {phase !== 'lobby' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  {lang === 'ar' ? `الجولة ${round}` : `Round ${round}`}
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-400 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Room Code Badge (if in room) */}
        {roomCode && (
          <div className="flex items-center gap-1.5 bg-stone-900/90 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs">
            <span className="text-stone-400 text-[11px] hidden md:inline">{t.roomCode}:</span>
            <span className="font-mono font-bold tracking-widest text-amber-400">{roomCode}</span>
            <button
              onClick={handleCopyCode}
              title={t.shareCode}
              className="p-1 hover:bg-white/10 rounded text-stone-300 hover:text-white transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* GitHub & Firebase Deployment Hub button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenDeployModal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-red-600/30 hover:from-amber-600/50 hover:to-orange-600/50 border border-amber-500/50 text-amber-200 transition-all shadow-md"
            title={t.githubExportBtn}
          >
            <Github className="w-3.5 h-3.5 text-white" />
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden lg:inline">{t.githubExportBtn}</span>
          </button>

          {/* Rules Modal */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            className="p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-white/10 transition-colors"
            title={t.instructions}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl transition-colors border ${
              isMuted 
                ? 'bg-red-950/60 border-red-500/40 text-red-400' 
                : 'bg-stone-900/90 hover:bg-stone-800 border-white/10 text-stone-300'
            }`}
            title={t.soundEffects}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Language Toggle (AR / EN) */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-white/10 text-xs font-bold transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
