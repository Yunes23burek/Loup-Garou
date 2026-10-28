import { useState } from 'react';
import { Player, Language } from '../types/game';
import { TRANSLATIONS } from '../i18n/translations';
import { PlayerAvatar } from './PlayerAvatar';
import { sound } from '../audio/soundEngine';
import { Vote, AlertTriangle, ShieldCheck } from 'lucide-react';

interface VotingPhaseViewProps {
  players: Player[];
  currentPlayer: Player;
  onCastVote: (targetId: string | null) => void;
  lang: Language;
}

export function VotingPhaseView({ players, currentPlayer, onCastVote, lang }: VotingPhaseViewProps) {
  const t = TRANSLATIONS[lang];
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(currentPlayer.voteTargetId || null);

  const livingPlayers = players.filter(p => p.isAlive);
  const otherLivingPlayers = livingPlayers.filter(p => p.uid !== currentPlayer.uid);

  // Compute vote counts for each player
  const voteTallies: Record<string, number> = {};
  players.forEach(p => {
    if (p.isAlive && p.voteTargetId) {
      voteTallies[p.voteTargetId] = (voteTallies[p.voteTargetId] || 0) + 1;
    }
  });

  const handleSelect = (targetId: string) => {
    if (!currentPlayer.isAlive) return;
    sound.playHeartbeat();
    setSelectedTargetId(targetId);
    onCastVote(targetId);
  };

  const handleSkipVote = () => {
    if (!currentPlayer.isAlive) return;
    sound.playClick();
    setSelectedTargetId(null);
    onCastVote(null);
  };

  return (
    <div className="bg-stone-950/70 border border-amber-500/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Vote className="w-5 h-5 text-amber-400" />
          <h3 className="font-serif font-bold text-base sm:text-lg text-amber-300">
            {t.phaseVoting}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {currentPlayer.isAlive ? (
            <button
              onClick={handleSkipVote}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors border ${
                selectedTargetId === null 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-stone-900 border-white/10 hover:border-white/20 text-stone-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 inline me-1" />
              {t.skipVote}
            </button>
          ) : (
            <span className="text-xs text-red-400 italic">
              {lang === 'ar' ? 'أنت في عالم الأرواح (لا يمكنك التصويت)' : 'You are in the spirit realm (cannot vote)'}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-stone-300 mb-6">
        {t.votingHint}
      </p>

      {/* Suspects Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6 justify-center">
        {livingPlayers.map(player => {
          const isSelf = player.uid === currentPlayer.uid;
          const isSelected = selectedTargetId === player.uid;
          const votes = voteTallies[player.uid] || 0;

          return (
            <div key={player.uid} className="flex flex-col items-center">
              <PlayerAvatar
                player={player}
                isSelf={isSelf}
                canSeeRole={false}
                voteCount={votes}
                isSelected={isSelected}
                isSelectable={currentPlayer.isAlive && !isSelf}
                onSelect={() => handleSelect(player.uid)}
                lang={lang}
              />

              {currentPlayer.isAlive && !isSelf && (
                <button
                  onClick={() => handleSelect(player.uid)}
                  className={`mt-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md shadow-red-900/50 scale-105'
                      : 'bg-stone-900/90 hover:bg-red-950/80 text-stone-300 border border-white/10'
                  }`}
                >
                  {isSelected ? (lang === 'ar' ? 'تم اختيارك ⚖️' : 'Voted ⚖️') : (lang === 'ar' ? 'تصويت' : 'Vote')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
