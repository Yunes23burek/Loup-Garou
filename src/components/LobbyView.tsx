import { useState } from 'react';
import { Player, Language, GameRoom } from '../types/game';
import { TRANSLATIONS, ROLES_DATA } from '../i18n/translations';
import { PlayerAvatar } from './PlayerAvatar';
import { sound } from '../audio/soundEngine';
import { 
  Users, 
  Bot, 
  Play, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  Trash2,
  Dice5
} from 'lucide-react';

interface LobbyViewProps {
  room: GameRoom;
  players: Player[];
  currentPlayer: Player;
  onUpdatePlayer: (name: string, avatar: string) => void;
  onAddBot: () => void;
  onRemovePlayer: (uid: string) => void;
  onStartGame: () => void;
  lang: Language;
}

const AVATAR_OPTIONS = ['🧔', '👩‍🦰', '👨‍🦳', '👩‍🌾', '🧔‍♂️', '🧕', '🧑‍🔬', '🧙', '🧝', '🧛', '🤠', '👸'];

export function LobbyView({
  room,
  players,
  currentPlayer,
  onUpdatePlayer,
  onAddBot,
  onRemovePlayer,
  onStartGame,
  lang
}: LobbyViewProps) {
  const t = TRANSLATIONS[lang];
  const [name, setName] = useState(currentPlayer.name);
  const [avatar, setAvatar] = useState(currentPlayer.avatar);
  const [isCopied, setIsCopied] = useState(false);

  const canStart = players.length >= 4;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    onUpdatePlayer(name.trim() || currentPlayer.name, avatar);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setIsCopied(true);
    sound.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner with Room Code */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.phaseLobby}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-200">
              {room.name || t.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              {lang === 'ar' 
                ? 'شارك رمز الغرفة مع أصدقائك أو أضف بوتات ذكية لبدء الجولة فوراً!' 
                : 'Share the room code with friends or add intelligent bots to start immediately!'}
            </p>
          </div>

          {/* Room Code Lockup */}
          <div className="bg-stone-950/80 border border-amber-500/40 rounded-2xl p-3 sm:p-4 text-center min-w-[180px] shadow-lg">
            <span className="text-[11px] text-stone-400 block mb-1">{t.roomCode}</span>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-2xl font-black tracking-widest text-amber-400">
                {room.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
                title={t.shareCode}
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Player Profile Customizer */}
        <div className="bg-stone-950/70 border border-white/10 rounded-2xl p-5 shadow-xl">
          <h3 className="font-serif font-bold text-sm sm:text-base text-amber-300 mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
            <span>🧙</span>
            <span>{t.chooseAvatar} & {t.yourName}</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs text-stone-400 block mb-1.5">{t.yourName}</label>
              <input
                type="text"
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="text-xs text-stone-400 block mb-1.5">{t.chooseAvatar}</label>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`p-2 rounded-xl text-2xl transition-all border ${
                      avatar === emoji 
                        ? 'bg-amber-500/20 border-amber-400 shadow-md scale-105' 
                        : 'bg-stone-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
            >
              {lang === 'ar' ? 'حفظ المظهر' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Right Column: Villagers List & Room Actions */}
        <div className="md:col-span-2 bg-stone-950/70 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-sm sm:text-base text-stone-100">
                  {t.playersInRoom} ({players.length})
                </h3>
              </div>

              {/* Add Bot button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onAddBot();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all shadow-sm"
              >
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.addBotPlayer}</span>
              </button>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {players.map((player) => (
                <div key={player.uid} className="relative group">
                  <PlayerAvatar
                    player={player}
                    isSelf={player.uid === currentPlayer.uid}
                    canSeeRole={false}
                    lang={lang}
                  />

                  {/* Remove bot button for host */}
                  {currentPlayer.isHost && player.isBot && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onRemovePlayer(player.uid);
                      }}
                      title={t.removeBot}
                      className="absolute -top-1 -right-1 p-1 bg-red-950 text-red-400 hover:text-white rounded-full border border-red-500/50 shadow-md opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Role Preview & Start CTA */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="text-xs text-stone-400 flex items-center gap-2">
                <Dice5 className="w-4 h-4 text-amber-400" />
                <span>
                  {players.length < 4 
                    ? t.needMorePlayers 
                    : (lang === 'ar' ? `تشكيلة متوازنة جاهزة لـ ${players.length} لاعبين` : `Balanced role deck ready for ${players.length} players`)}
                </span>
              </div>

              {players.length < 4 && (
                <button
                  onClick={() => {
                    sound.playClick();
                    // Fill up to 5 players with bots with one click
                    while (players.length < 5) {
                      onAddBot();
                    }
                  }}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  ⚡ {lang === 'ar' ? 'ملء الغرفة بالبوتات فوراً' : 'Auto-fill room with bots'}
                </button>
              )}
            </div>

            {currentPlayer.isHost ? (
              <button
                onClick={() => {
                  sound.playWolfHowl();
                  onStartGame();
                }}
                disabled={!canStart}
                className={`w-full py-3.5 px-6 rounded-2xl font-serif font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 transition-all shadow-xl ${
                  canStart
                    ? 'bg-gradient-to-r from-red-700 via-amber-600 to-red-700 hover:from-red-600 hover:to-red-600 text-white shadow-red-950/80 scale-[1.01]'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{t.startGame}</span>
              </button>
            ) : (
              <div className="bg-stone-900 border border-white/5 rounded-xl p-3 text-center text-xs text-stone-400">
                ⏳ {lang === 'ar' ? 'في انتظار أن يطلق مضيف القرية صافرة البداية...' : 'Waiting for the village host to start the game...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
