export type RoleType = 
  | 'villager'
  | 'werewolf'
  | 'seer'
  | 'witch'
  | 'hunter'
  | 'bodyguard'
  | 'cupid'
  | 'unassigned';

export type GamePhase = 
  | 'lobby'
  | 'night_start'
  | 'werewolves'
  | 'seer'
  | 'witch'
  | 'bodyguard'
  | 'day_sunrise'
  | 'day_discussion'
  | 'voting'
  | 'verdict'
  | 'game_over';

export type Language = 'ar' | 'en';

export interface Player {
  uid: string;
  name: string;
  avatar: string;
  role: RoleType;
  isAlive: boolean;
  isHost: boolean;
  isBot?: boolean;
  isMuted?: boolean;
  isSpeaking?: boolean;
  voteTargetId?: string | null;
  nightTargetId?: string | null;
  joinedAt: number;
  inLoveWithId?: string | null;
}

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  hostName: string;
  name: string;
  status: 'lobby' | 'in_game' | 'ended';
  phase: GamePhase;
  round: number;
  language: Language;
  timer: number;
  maxPlayers: number;
  winner?: 'werewolves' | 'villagers' | 'lovers' | 'none';
  nightVictimId?: string | null;
  witchSaved?: boolean;
  witchPotionHealUsed?: boolean;
  witchPotionPoisonUsed?: boolean;
  witchPoisonedId?: string | null;
  seerCheckedId?: string | null;
  bodyguardProtectedId?: string | null;
  lastEliminated?: {
    id: string;
    name: string;
    role: RoleType;
    reason: 'werewolves' | 'witch' | 'vote' | 'hunter' | 'heartbreak';
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GameMessage {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'chat' | 'system' | 'narrator' | 'night' | 'elimination';
  timestamp: number;
  roleVisibility?: 'all' | 'werewolves' | 'dead';
}

export interface VoiceSignal {
  id?: string;
  senderId: string;
  targetId: string;
  type: 'offer' | 'answer' | 'candidate';
  data: string;
  timestamp: number;
}

export interface RoleConfig {
  type: RoleType;
  nameAr: string;
  nameEn: string;
  team: 'villagers' | 'werewolves' | 'neutral';
  descriptionAr: string;
  descriptionEn: string;
  abilityAr: string;
  abilityEn: string;
  icon: string;
  color: string;
  bgGradient: string;
  minPlayersNeeded: number;
}
