
export enum ChallengeTopic {
  SCIENCE = 'IQ Science',
  BIOLOGY = 'Biology',
  CHEMISTRY = 'Chemistry',
  ENGLISH = 'English',
  GENERAL_KNOWLEDGE = 'General Knowledge',
  PHYSICS = 'Physics'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum TileType {
  FORCE = 'force',
  MASS = 'mass',
  VELOCITY = 'velocity',
  ACCELERATION = 'acceleration',
  GRAVITY = 'gravity',
  OBSTACLE = 'obstacle'
}

export interface PhysicsQuestion {
  id: string;
  topic: ChallengeTopic;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WordChallenge {
  word: string;
  hint: string;
  scrambled: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
}

export interface GameState {
  score: number;
  stability: number;
  level: number;
  topic: ChallengeTopic;
  isGameOver: boolean;
  collectedTargetCount: number;
  requiredTargetCount: number;
  currentTargetType: TileType;
  isExploding: boolean;
  princessImageUrl: string | null;
  isWordChallengeMode: boolean;
}

export interface Tile {
  id: string;
  type: TileType;
  x: number;
  y: number;
  isMatched?: boolean;
}
