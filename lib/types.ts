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
  isBot: boolean;
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

export type TurnStage = "awaiting-turn" | "suggesting" | "revealing" | "picking-opponent" | "accuse-or-end";

export interface LogEntry {
  id: string;
  ts: number;
  kind: "system" | "turn" | "suggestion" | "reveal" | "accusation" | "win" | "elimination";
  text: string;
}

// --- Suggestion History ---

export interface SuggestionHistoryEntry {
  id: string;
  suggesterId: string;
  suggesterName: string;
  suggestion: Suggestion;
  opposingPlayers: { id: string; name: string }[];
  chosenOpponentId: string | null;
  chosenOpponentName: string | null;
  revealedCardId: string | null;   // only populated for the suggester in client view
  noOneOpposed: boolean;
}

// --- Server-side Game State ---

export interface ActiveSuggestion {
  suggesterId: string;
  suggestion: Suggestion;
  /** All opponents who need to respond */
  revealQueue: string[];
  /** Maps playerId → cardId they chose to show (null = pass/no match) */
  opponentResponses: Record<string, string | null>;
  /** Player IDs who had matching cards (filled once all respond) */
  opposingPlayerIds: string[];
  /** True once all opponents have responded */
  allResponded: boolean;
  /** The opponent the suggester picked (set during picking-opponent) */
  chosenOpponentId: string | null;
  /** The card revealed by the chosen opponent */
  revealedCardId: string | null;
  /** True once the suggestion has fully resolved (result is being shown) */
  resolved: boolean;
  // Legacy fields kept for compatibility during transition
  revealingPlayerId: string | null;
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
  hasSuggested: boolean;
  activeSuggestion: ActiveSuggestion | null;
  suggestionHistory: SuggestionHistoryEntry[];
  log: LogEntry[];
  winner: string | null;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
}

// --- Client-side views ---

export interface ClientPlayerView {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  ready: boolean;
  handCount: number;
  eliminated: boolean;
  isMe: boolean;
  connected: boolean;
}

export interface ClientActiveSuggestion {
  suggesterId: string;
  suggesterName: string;
  suggestion: Suggestion;
  /** Which opponents I need to respond to (for RevealPrompt — true if I'm in queue and haven't responded) */
  iMustRespond: boolean;
  /** True while waiting for all opponents to respond */
  waitingForResponses: boolean;
  /** Players who opposed (had matching cards) — populated once all responded */
  opposingPlayers: { id: string; name: string }[];
  /** True when we're in picking-opponent phase */
  pickingOpponent: boolean;
  /** The chosen opponent (set after suggester picks) */
  chosenOpponentId: string | null;
  chosenOpponentName: string | null;
  /** The card revealed — only set for the suggester */
  revealedCardId: string | null;
  /** Card revealed specifically to me (the suggester) */
  revealedToMe: string | null;
  /** True when the suggestion is fully resolved — result is being displayed */
  resolved: boolean;
  /** True if no one had a matching card */
  noOneOpposed: boolean;
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
  hasSuggested: boolean;
  activeSuggestion: ClientActiveSuggestion | null;
  suggestionHistory: SuggestionHistoryEntry[];
  log: LogEntry[];
  winner: string | null;
  winnerName: string | null;
  revealedEnvelope: ConfidentialEnvelope | null;
}
