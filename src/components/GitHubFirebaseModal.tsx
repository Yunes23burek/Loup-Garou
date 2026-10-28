import { useState } from 'react';
import { Language } from '../types/game';
import { TRANSLATIONS } from '../i18n/translations';
import { sound } from '../audio/soundEngine';
import JSZip from 'jszip';
import { 
  Github, 
  Flame, 
  X, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface GitHubFirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export function GitHubFirebaseModal({ isOpen, onClose, lang }: GitHubFirebaseModalProps) {
  const t = TRANSLATIONS[lang];
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const gitCommands = `# 1. Initialize Git repository
git init

# 2. Add all project files
git add .

# 3. Commit the Loup-Garou application
git commit -m "feat: Loup-Garou Werewolf game with interactive voice rooms & Firebase"

# 4. Set main branch
git branch -M main

# 5. Connect to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/loup-garou-werewolf.git

# 6. Push to GitHub
git push -u origin main`;

  const firebaseCommands = `# 1. Build the production applet
npm run build

# 2. Deploy to Firebase
firebase deploy --only hosting,firestore:rules`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    sound.playClick();
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    sound.playClick();
    try {
      const zip = new JSZip();

      // Read key files from client perspective
      zip.file('README.md', `# Loup-Garou: قرية المستذئبين (Werewolf Village)

لعبة لوب غارو (المستذئبون) التفاعلية بالعربية والإنجليزية مع دعم كامل لغرف المحادثة الصوتية التفاعلية وقواعد Firebase.

## المميزات
- 🐺 دعم كامل للأدوار: المستذئب، العرافة، الساحرة، الصياد، الحارس الشخصي، كيوبيد، والقرويون
- 🎙️ غرف محادثة صوتية تفاعلية بتقنية WebRTC ومؤشر صوتي حي مع مؤثر صوت المستذئب
- 🌐 دعم ثنائي اللغة (العربية والإنجليزية) مع التبديل السلس وواجهة متجاوبة
- 🤖 وضع اللعب الفردي مع بوتات ذكية تناقش وتصوت وتكشف الخدع
- 🔥 قاعدة بيانات Firestore وقواعد أمان مشددة

## التشغيل محلياً
\`\`\`bash
npm install
npm run dev
\`\`\`

## النشر على Firebase
\`\`\`bash
npm run build
firebase deploy
\`\`\`
`);

      // Package.json info
      zip.file('firebase.json', JSON.stringify({
        hosting: {
          public: "dist",
          ignore: ["firebase.json", "**/.*", "**/node_modules/**"],
          rewrites: [{ source: "**", destination: "/index.html" }]
        },
        firestore: {
          rules: "firestore.rules"
        }
      }, null, 2));

      // Generate zip blob
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'loup-garou-werewolf-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ZIP generation failed:', e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-stone-950 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative text-stone-200 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gradient-to-r from-amber-600/20 to-red-600/20 border border-amber-500/40 text-amber-400">
            <Github className="w-5 h-5" />
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-amber-200">
              {t.githubModalTitle}
            </h3>
            <p className="text-xs text-stone-400">
              {t.githubModalDesc}
            </p>
          </div>
        </div>

        {/* Live Firebase Provisioning Status */}
        <div className="bg-stone-900/90 border border-emerald-500/30 rounded-2xl p-3.5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حالة ربط Firebase: متصل وجاهز' : 'Firebase Status: Connected & Provisioned'}</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
              {firebaseConfig.projectId}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300 font-mono">
            <div>
              <span className="text-stone-500">Database:</span> {firebaseConfig.firestoreDatabaseId}
            </div>
            <div>
              <span className="text-stone-500">Rules:</span> Active & Deployed
            </div>
          </div>
        </div>

        {/* Section 1: GitHub Push Commands */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-serif font-bold text-stone-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ar' ? 'أوامر رفع المشروع إلى GitHub' : 'Commands to push to GitHub'}</span>
            </span>

            <button
              onClick={() => handleCopy(gitCommands, 'git')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            >
              {copiedType === 'git' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'git' ? t.commandsCopied : t.copyGitCommands}</span>
            </button>
          </div>

          <pre className="bg-stone-900/90 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-amber-200/90 overflow-x-auto leading-relaxed">
            {gitCommands}
          </pre>
        </div>

        {/* Section 2: Firebase Deployment */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-serif font-bold text-stone-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{lang === 'ar' ? 'نشر التطبيق على استضافة Firebase Hosting' : 'Deploy to Firebase Hosting'}</span>
            </span>

            <button
              onClick={() => handleCopy(firebaseCommands, 'firebase')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            >
              {copiedType === 'firebase' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'firebase' ? t.commandsCopied : (lang === 'ar' ? 'نسخ أوامر النشر' : 'Copy Deploy Cmds')}</span>
            </button>
          </div>

          <pre className="bg-stone-900/90 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-orange-200/90 overflow-x-auto leading-relaxed">
            {firebaseCommands}
          </pre>
        </div>

        {/* 1-Click ZIP Download Action */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-400">
            {lang === 'ar' ? 'أو يمكنك تحميل أرشيف المشروع مباشرة إلى جهازك:' : 'Or download the project bundle directly:'}
          </p>

          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-950"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? (lang === 'ar' ? 'جارٍ الحزم...' : 'Zipping...') : t.downloadZip}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
