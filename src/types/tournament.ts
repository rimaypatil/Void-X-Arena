export type TournamentStatus = 'UPCOMING' | 'FILLING_FAST' | 'LIVE' | 'COMPLETED';

export type GameModeType = 
  | 'BATTLE_ROYALE_SOLO' 
  | 'BATTLE_ROYALE_SQUAD' 
  | 'CLASH_SQUAD_4V4' 
  | 'CLASH_SQUAD_1V1'
  | 'DUEL_1V1' 
  | 'SURVIVAL_WAR' 
  | 'CUSTOM_CUP';

export interface PrizeBreakdown {
  rank: string;
  amount: string;
  percentage?: string;
}

export interface Tournament {
  id: string;
  title: string;
  subtitle: string;
  gameMode: GameModeType;
  gameModeLabel: string;
  map: string;
  entryFee: number; // in INR
  entryFeeLabel: string;
  prizePool: number; // in INR
  prizePoolLabel: string;
  perKillPrize?: number;
  totalSlots: number;
  filledSlots: number;
  startTime: string; // ISO or human readable
  startTimeFormatted: string;
  status: TournamentStatus;
  isFeatured?: boolean;
  version: 'Mobile Only' | 'Open (No Emulators)' | 'All Devices';
  rules: string[];
  prizeBreakdown: PrizeBreakdown[];
}

export interface GameModeInfo {
  id: GameModeType | string;
  title: string;
  tagline: string;
  description: string;
  teamSize: string;
  mapOptions: string[];
  combatStyle: string;
  iconName: string;
  featuredStat: string;
  badgeColor?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Tournaments' | 'App & Room ID' | 'Rules & Fair Play';
}

export interface PlatformStat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  subtext: string;
}

export interface PlayerPayout {
  id: number;
  name: string;
  withdrawal: number;
  kills: number;
  event: string;
}
