import { useState, useRef, useEffect } from 'react';
import { GameMessage, Language, Player } from '../types/game';
import { TRANSLATIONS } from '../i18n/translations';
import { Send, ScrollText, MessageSquare, AlertCircle } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface ChatBoxProps {
  messages: GameMessage[];
  onSendMessage: (text: string) => void;
  lang: Language;
  currentPlayer: Player;
}

export function ChatBox({ messages, onSendMessage, lang, currentPlayer }: ChatBoxProps) {
  const t = TRANSLATIONS[lang];
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'log'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sound.playClick();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const filteredMessages = activeTab === 'log' 
    ? messages.filter(m => m.type !== 'chat')
    : messages;

  return (
    <div className="flex flex-col h-full bg-stone-950/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 bg-stone-900/60">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'all' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الدردشة والوقائع' : 'Chat & Log'}</span>
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'log' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>{t.gameLog}</span>
          </button>
        </div>

        <span className="text-[11px] text-stone-500 font-mono">
          {messages.length} {lang === 'ar' ? 'سجل' : 'events'}
        </span>
      </div>

      {/* Messages Scroll View */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 text-xs sm:text-sm font-sans"
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-500 py-8">
            <ScrollText className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">{lang === 'ar' ? 'لا توجد أحداث بعد...' : 'No events recorded yet...'}</p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isSelf = msg.senderId === currentPlayer.uid;
            const isSystem = msg.type === 'system' || msg.type === 'narrator';
            const isNight = msg.type === 'night';
            const isElimination = msg.type === 'elimination';

            if (isElimination) {
              return (
                <div key={index} className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 shadow-sm animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-300">{msg.senderName}</p>
                    <p className="text-stone-200">{msg.text}</p>
                  </div>
                </div>
              );
            }

            if (isNight) {
              return (
                <div key={index} className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs italic">
                  🌙 {msg.text}
                </div>
              );
            }

            if (isSystem) {
              return (
                <div key={index} className="p-2 rounded-xl bg-stone-900/90 border border-amber-500/20 text-amber-200/90 text-xs">
                  📜 <span className="font-serif font-semibold text-amber-400">{msg.senderName}:</span> {msg.text}
                </div>
              );
            }

            return (
              <div 
                key={index} 
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="text-[11px] font-semibold text-stone-300">{msg.senderName}</span>
                  <span className="text-[10px] text-stone-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div 
                  className={`px-3 py-2 rounded-2xl max-w-[85%] break-words shadow-md ${
                    isSelf 
                      ? 'bg-amber-600/90 text-black font-medium rounded-ee-none' 
                      : 'bg-stone-800 text-stone-100 rounded-es-none border border-white/5'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="p-2 border-t border-white/10 bg-stone-900/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.chatPlaceholder}
          maxLength={300}
          className="flex-1 bg-stone-950 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/60"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black transition-colors"
        >
          <Send className="w-4 h-4 rtl:rotate-180" />
        </button>
      </form>
    </div>
  );
}
