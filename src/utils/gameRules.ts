import { Player, RoleType } from '../types/game';

export function distributeRoles(players: Player[]): Player[] {
  const count = players.length;
  const roles: RoleType[] = [];

  if (count <= 4) {
    roles.push('werewolf', 'seer', 'villager', 'villager');
  } else if (count === 5) {
    roles.push('werewolf', 'seer', 'witch', 'villager', 'villager');
  } else if (count === 6) {
    roles.push('werewolf', 'werewolf', 'seer', 'witch', 'hunter', 'villager');
  } else if (count === 7) {
    roles.push('werewolf', 'werewolf', 'seer', 'witch', 'hunter', 'bodyguard', 'villager');
  } else {
    // 8+ players
    roles.push('werewolf', 'werewolf', 'seer', 'witch', 'hunter', 'bodyguard', 'cupid');
    while (roles.length < count) {
      if (roles.filter(r => r === 'werewolf').length < Math.floor(count / 3)) {
        roles.push('werewolf');
      } else {
        roles.push('villager');
      }
    }
  }

  // Shuffle roles with Fisher-Yates
  const shuffled = [...roles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return players.map((player, idx) => ({
    ...player,
    role: shuffled[idx] || 'villager',
    isAlive: true,
    voteTargetId: null,
    nightTargetId: null
  }));
}

export function checkVictoryCondition(players: Player[]): 'werewolves' | 'villagers' | 'lovers' | null {
  const alive = players.filter(p => p.isAlive);
  if (alive.length === 0) return 'villagers'; // Draw/edge case

  const werewolves = alive.filter(p => p.role === 'werewolf');
  const villagers = alive.filter(p => p.role !== 'werewolf');

  // Check Lovers victory
  const lovers = alive.filter(p => p.inLoveWithId);
  if (lovers.length === 2 && alive.length === 2 && lovers[0].inLoveWithId === lovers[1].uid) {
    return 'lovers';
  }

  if (werewolves.length === 0) {
    return 'villagers';
  }

  if (werewolves.length >= villagers.length) {
    return 'werewolves';
  }

  return null;
}
