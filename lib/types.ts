export type CardTypeId = "person" | "location" | "weapon" | "motive" | "time";

export const CARD_TYPES: CardTypeId[] = ["person", "location", "weapon", "motive", "time"];

export const CARD_TYPE_LABELS: Record<CardTypeId, string> = {
  person: "Person (Who)",
  location: "Location (Where)",
  weapon: "Weapon (How)",
  motive: "Motive (Why)",
  time: "Time (When)",
};

export interface CardDef {
  id: string;
  type: CardTypeId;
  name: string;
  image: string;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
  hand: CardDef[];
  eliminated: boolean;
  seenCards: string[];
  lastSeenAt: number;
}

export interface RoomConfig {
  cardTypes: CardTypeId[];
  maxPerType: Record<CardTypeId, number>;
}

export type Suggestion = Partial<Record<CardTypeId, string>>;

export interface ConfidentialEnvelope {
  person?: CardDef;
  location?: CardDef;
  weapon?: CardDef;
  motive?: CardDef;
  time?: CardDef;
}

export type GamePhase = "waiting" | "dealing" | "playing" | "finished";

export type TurnStage = "awaiting-turn" | "suggesting" | "revealing" | "accuse-or-end";

export interface LogEntry {
  id: string;
  ts: number;
  kind: "system" | "turn" | "suggestion" | "reveal" | "accusation" | "win" | "elimination";
  text: string;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  config: RoomConfig;
  players: Player[];
  deck: CardDef[];
  envelope: ConfidentialEnvelope;
  currentTurnIdx: number;
  turnStage: TurnStage;
  activeSuggestion: {
    suggesterId: string;
    suggestion: Suggestion;
    revealQueue: string[];
    revealingPlayerId: string | null;
    revealedCardId: string | null;
  } | null;
  log: LogEntry[];
  winner: string | null;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface ClientPlayerView {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
  handCount: number;
  eliminated: boolean;
  isMe: boolean;
}

export interface ClientGameState {
  id: string;
  phase: GamePhase;
  config: RoomConfig;
  players: ClientPlayerView[];
  myHand: CardDef[];
  mySeenCards: string[];
  currentTurnIdx: number;
  currentTurnPlayerId: string | null;
  turnStage: TurnStage;
  activeSuggestion: {
    suggesterId: string;
    suggestion: Suggestion;
    revealingPlayerId: string | null;
    revealedCardId: string | null;
    revealedToMe: string | null;
  } | null;
  log: LogEntry[];
  winner: string | null;
  winnerName: string | null;
  revealedEnvelope: ConfidentialEnvelope | null;
}
