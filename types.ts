
export interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: UserRole;
  joinedDate: string;
  socials: SocialLinks;
  isBanned?: boolean;
  isVerified?: boolean;
  website?: string;
  bio?: string;
}

export type UserRole = 'admin' | 'it' | 'editor' | 'author' | 'moderator' | 'vip' | 'user';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  dimensions?: { width: number; height: number };
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  color: string;
  logo: string;
  carImage: string;
  nationalityFlag: string;
  nationalityText: string;
  entryYear: number;
  teamPrincipal: string;
  base: string;
  chassis: string;
  powerUnit: string;
  socials: SocialLinks;
  bio: string;
  gallery: string[];
  points: number;
  rank: number;
  trend: 'up' | 'down' | 'same';
  order?: number;
}

// Add Constructor alias for Team as expected in constants.ts
export type Constructor = Team;

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  raceNumber: number;
  teamId: string | null;
  slug: string;
  image: string;
  nationalityFlag: string;
  nationalityText: string;
  dob: string;
  birthplace: string;
  height: number;
  weight: number;
  socials: SocialLinks;
  bio: string;
  gallery: string[];
  rank: number;
  points: number;
  trend: 'up' | 'down' | 'same';
  order?: number;
  maritalStatus?: string;
}

export type RaceFormat = 'standard' | 'sprint';
export type RaceStatus = 'upcoming' | 'next' | 'live' | 'completed' | 'cancelled';

// Define SessionType for results and prediction features
export type SessionType = 'fp1' | 'fp2' | 'fp3' | 'qualifying' | 'sprint' | 'sprintQuali' | 'race';

export interface Race {
  id: string;
  round: number;
  country: string;
  city: string;
  circuitName: string;
  flag: string;
  format: RaceFormat;
  status: RaceStatus;
  sessions: any;
  trackMap?: string;
}

export interface ResultEntry {
  position: string;
  driverId: string;
  teamId: string;
  time: string;
  laps: number;
  points: number;
  q1?: string;
  q2?: string;
  q3?: string;
}

export interface SessionResult {
  id?: number;
  raceId: string;
  sessionType: SessionType;
  entries: ResultEntry[];
  distancePercentage?: number;
}

// Prediction Related Types
export type RoundStatus = 'open' | 'locked' | 'settled';

export interface UserBet {
  id: string;
  userId: string;
  season: number;
  raceId: string;
  sessionType: SessionType;
  drivers: string[];
  timestamp: string;
}

export interface PredictionSettings {
  id: string;
  currentSeason: number;
  racePoints: number[];
  qualiPoints: number[];
  participationPoint: number;
}

export interface BonusQuestion {
  id: string;
  season: number;
  question: string;
  points: number;
  deadline: string;
  correctAnswer?: string;
}

export interface UserBonusBet {
  userId: string;
  questionId: string;
  answer: string;
}

export interface PredictionRoundState {
  id: string; // raceId-sessionType
  status: RoundStatus;
}

// --- RECURSIVE AST BLOCK TYPES ---

export type BlockType = 
  | 'custom/paragraph' 
  | 'custom/heading' 
  | 'custom/list'
  | 'custom/quote'
  | 'custom/details'
  | 'custom/table'
  | 'custom/image' 
  | 'custom/gallery' 
  | 'custom/slider'
  | 'custom/youtube'
  | 'custom/spotify'
  | 'custom/separator'
  | 'custom/comment'
  | 'f1/driver'
  | 'f1/team'
  | 'f1/event'
  | 'f1/calendar'
  | 'f1/standings'
  | 'f1/results'
  | 'f1/title-watch';

export interface BlockAttributes {
  content?: string;
  level?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  backgroundColor?: string;
  fontSize?: string;
  url?: string;
  id?: string; // Generic ID for F1 entities or Embeds
  mode?: 'minimal' | 'full';
  items?: any[]; // For lists, tables, sliders
  headers?: string[]; // For tables
  summary?: string; // For details block
  caption?: string;
  columns?: number;
  sessionId?: string; // For results integration
  viewMode?: 'edit' | 'preview'; // Added for editor toggle
  [key: string]: any;
}

export interface ContentBlock {
  clientId: string;
  type: BlockType;
  attributes: BlockAttributes;
  innerBlocks: ContentBlock[];
}

export type PostSection = 'highlight' | 'aktuell' | 'updated' | 'trending' | 'ausgewählt' | 'feed';
export type PostStatus = 'published' | 'draft';

export interface PostLayoutOptions {
  showLatestNews?: boolean;
  showNextRace?: boolean;
  enableComments?: boolean;
}

export interface Post {
  id: string;
  title: string;
  excerpt?: string;
  slug?: string; // Added slug for URL handling
  author: string;
  authorId?: string; // Linked User ID for sync
  date: string;
  image: string;
  tags: string[];
  commentCount: number;
  readTime: string;
  section: PostSection[]; // Changed to Array to allow multiple sections
  status: PostStatus;
  blocks: ContentBlock[];
  // Added properties for content management and layout
  content?: string;
  heroCaption?: string;
  heroCredits?: string;
  isUpdated?: boolean; // Label to show update status
  layoutOptions?: PostLayoutOptions; // Sidebar toggles
}
