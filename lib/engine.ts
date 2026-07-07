import { DEFAULT_CARDS } from "./cards";
import { makeLog } from "./store";
import type {
  CardDef,
  CardTypeId,
  ConfidentialEnvelope,
  GameState,
  Player,
  RoomConfig,
  Suggestion,
} from "./types";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;
export const MIN_CARD_TYPES = 3;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const CARD_TYPE_ORDER: CardTypeId[] = ["person", "location", "weapon", "motive", "time"];

export function defaultConfig(): RoomConfig {
  const maxPerType = {
    person: 6,
    location: 6,
    weapon: 5,
    motive: 4,
    time: 3,
  } as Record<CardTypeId, number>;
  return { cardTypes: ["person", "location", "weapon"], maxPerType };
}

export function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildDeck(config: RoomConfig): CardDef[] {
  const deck: CardDef[] = [];
  for (const type of CARD_TYPE_ORDER) {
    if (!config.cardTypes.includes(type)) continue;
    const max = Math.max(1, config.maxPerType[type] ?? 1);
    const pool = DEFAULT_CARDS[type].slice(0, max);
    deck.push(...pool);
  }
  return deck;
}

export function dealEnvelope(deck: CardDef[], config: RoomConfig): ConfidentialEnvelope {
  const envelope: ConfidentialEnvelope = {};
  const remaining = deck.slice();
  for (const type of CARD_TYPE_ORDER) {
    if (!config.cardTypes.includes(type)) continue;
    const idx = remaining.findIndex((c) => c.type === type);
    if (idx >= 0) {
      const [picked] = remaining.splice(idx, 1);
      envelope[type] = picked;
    }
  }
  return envelope;
}

export function dealHands(remaining: CardDef[], players: Player[]): void {
  for (const p of players) p.hand = [];
  const shuffled = shuffle(remaining);
  players.forEach((p) => (p.hand = []));
  let idx = 0;
  while (idx < shuffled.length) {
    const target = players[idx % players.length];
    target.hand.push(shuffled[idx]);
    idx++;
  }
}

export function validateConfig(config: RoomConfig): string | null {
  if (!Array.isArray(config.cardTypes) || config.cardTypes.length < MIN_CARD_TYPES) {
    return `Pick at least ${MIN_CARD_TYPES} card types.`;
  }
  for (const t of config.cardTypes) {
    const max = config.maxPerType?.[t];
    if (typeof max !== "number" || max < 1) return `Each selected type needs at least 1 card.`;
    if (max > DEFAULT_CARDS[t].length) {
      return `Too many cards for ${t}. Max available: ${DEFAULT_CARDS[t].length}.`;
    }
  }
  return null;
}

export function canStart(room: GameState): string | null {
  if (room.players.length < MIN_PLAYERS) return `Need at least ${MIN_PLAYERS} players.`;
  if (room.players.length > MAX_PLAYERS) return `Max ${MAX_PLAYERS} players.`;
  if (!room.players.every((p) => p.ready)) return "All players must be ready.";
  return validateConfig(room.config);
}

export function startGame(room: GameState): string | null {
  const err = canStart(room);
  if (err) return err;
  const deck = buildDeck(room.config);
  const envelope = dealEnvelope(deck, room.config);
  const usedIds = new Set(Object.values(envelope).flatMap((c) => (c ? [c.id] : [])));
  const remaining = deck.filter((c) => !usedIds.has(c.id));
  dealHands(remaining, room.players);
  room.deck = deck;
  room.envelope = envelope;
  room.phase = "playing";
  room.turnStage = "awaiting-turn";
  room.hasSuggested = false;
  room.currentTurnIdx = 0;
  room.startedAt = Date.now();
  room.log.unshift(makeLog("system", "Game started. The killer's identity is sealed in the envelope."));
  return null;
}

export function isSuggestionComplete(s: Suggestion, types: CardTypeId[]): boolean {
  return types.every((t) => s[t]);
}

export function buildEnvelopeFromSuggestion(s: Suggestion, deck: CardDef[]): ConfidentialEnvelope {
  const env: ConfidentialEnvelope = {};
  for (const type of CARD_TYPE_ORDER) {
    const id = s[type];
    if (id) {
      const card = deck.find((c) => c.id === id);
      if (card) env[type] = card;
    }
  }
  return env;
}

export function envelopeMatches(
  suggestion: Suggestion,
  envelope: ConfidentialEnvelope,
  types: CardTypeId[],
): boolean {
  return types.every((t) => envelope[t] && envelope[t]!.id === suggestion[t]);
}

export function suggest(
  room: GameState,
  playerId: string,
  suggestion: Suggestion,
): string | null {
  if (room.phase !== "playing") return "Game not in progress.";
  if (room.players[room.currentTurnIdx]?.id !== playerId) return "Not your turn.";
  if (room.turnStage !== "awaiting-turn") return "Cannot suggest now.";
  if (room.hasSuggested) return "You already made a suggestion this turn.";
  if (!isSuggestionComplete(suggestion, room.config.cardTypes)) return "Suggestion is incomplete.";
  room.hasSuggested = true;
  room.turnStage = "revealing";
  const queue = room.players
    .filter((p) => p.id !== playerId && !p.eliminated)
    .map((p) => p.id);
  room.activeSuggestion = {
    suggesterId: playerId,
    suggestion,
    revealQueue: queue,
    revealingPlayerId: queue[0] ?? null,
    revealedCardId: null,
  };
  const labels = describeSuggestion(suggestion, room.deck);
  room.log.unshift(
    makeLog("suggestion", `${playerName(room, playerId)} suspects: ${labels}.`),
  );
  // If no one to reveal (all eliminated except suggester), finish immediately
  if (queue.length === 0) {
    finishSuggestion(room, null);
  }
  return null;
}

export function cardsMatchingSuggestion(player: Player, suggestion: Suggestion): CardDef[] {
  return player.hand.filter((c) => suggestion[c.type] === c.id);
}

export function revealCard(
  room: GameState,
  revealerId: string,
  cardId: string | null,
): string | null {
  const active = room.activeSuggestion;
  if (!active) return "No active suggestion.";
  if (active.revealingPlayerId !== revealerId) return "Not your turn to reveal.";
  const revealer = room.players.find((p) => p.id === revealerId);
  if (!revealer) return "Unknown player.";
  if (cardId !== null) {
    const match = cardsMatchingSuggestion(revealer, active.suggestion).find((c) => c.id === cardId);
    if (!match) return "You must reveal a card that matches the suggestion, or pass.";
    active.revealedCardId = cardId;
    room.log.unshift(
      makeLog("reveal", `${revealer.name} secretly showed a card to ${playerName(room, active.suggesterId)}.`),
    );
  } else {
    if (cardsMatchingSuggestion(revealer, active.suggestion).length > 0) {
      return "You have a matching card; you must reveal one.";
    }
    room.log.unshift(makeLog("reveal", `${revealer.name} had no matching card.`));
  }
  advanceRevealQueue(room, cardId);
  return null;
}

function advanceRevealQueue(room: GameState, revealedCardId: string | null): void {
  const active = room.activeSuggestion!;
  const nextQueue = active.revealQueue.slice(1);
  active.revealQueue = nextQueue;
  if (revealedCardId) {
    finishSuggestion(room, revealedCardId);
    return;
  }
  if (nextQueue.length === 0) {
    finishSuggestion(room, null);
  } else {
    active.revealingPlayerId = nextQueue[0];
    active.revealedCardId = null;
  }
}

function finishSuggestion(room: GameState, revealedCardId: string | null): void {
  const active = room.activeSuggestion!;
  if (revealedCardId) {
    const suggester = room.players.find((p) => p.id === active.suggesterId);
    if (suggester && !suggester.seenCards.includes(revealedCardId)) {
      suggester.seenCards.push(revealedCardId);
    }
  }
  room.activeSuggestion = null;
  // Auto-advance to next player's turn
  advanceTurn(room);
}

export function accuse(
  room: GameState,
  playerId: string,
  suggestion: Suggestion,
): string | null {
  if (room.phase !== "playing") return "Game not in progress.";
  if (room.players[room.currentTurnIdx]?.id !== playerId) return "Not your turn.";
  if (room.turnStage !== "awaiting-turn")
    return "Cannot accuse right now.";
  if (!isSuggestionComplete(suggestion, room.config.cardTypes)) return "Accusation is incomplete.";
  const correct = envelopeMatches(suggestion, room.envelope, room.config.cardTypes);
  const labels = describeSuggestion(suggestion, room.deck);
  if (correct) {
    room.phase = "finished";
    room.turnStage = "awaiting-turn";
    room.winner = playerId;
    room.finishedAt = Date.now();
    room.log.unshift(makeLog("win", `${playerName(room, playerId)} accused correctly and WINS: ${labels}.`));
  } else {
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.eliminated = true;
    room.log.unshift(
      makeLog("accusation", `${playerName(room, playerId)} accused ${labels} — WRONG. They are out.`),
    );
    if (activePlayers(room).length < 2) {
      room.phase = "finished";
      room.winner = null;
      room.finishedAt = Date.now();
      room.log.unshift(makeLog("system", "No players left who can win. The killer escapes."));
    } else {
      // Auto-advance to next player's turn after a wrong accusation
      advanceTurn(room);
    }
  }
  return null;
}

export function endTurn(room: GameState, playerId: string): string | null {
  if (room.phase !== "playing") return "Game not in progress.";
  if (room.players[room.currentTurnIdx]?.id !== playerId) return "Not your turn.";
  if (room.turnStage !== "accuse-or-end" && room.turnStage !== "awaiting-turn") return "Resolve the suggestion first.";
  room.activeSuggestion = null;
  advanceTurn(room);
  return null;
}

export function advanceTurn(room: GameState): void {
  const n = room.players.length;
  if (n === 0) return;
  let next = (room.currentTurnIdx + 1) % n;
  let hops = 0;
  while (room.players[next].eliminated && hops < n) {
    next = (next + 1) % n;
    hops++;
  }
  room.currentTurnIdx = next;
  room.turnStage = "awaiting-turn";
  room.hasSuggested = false;
  room.log.unshift(makeLog("turn", `${room.players[next].name}'s turn.`));
}

export function activePlayers(room: GameState): Player[] {
  return room.players.filter((p) => !p.eliminated);
}

export function playerName(room: GameState, id: string): string {
  return room.players.find((p) => p.id === id)?.name ?? "Unknown";
}

export function describeSuggestion(s: Suggestion, deck: CardDef[]): string {
  const parts: string[] = [];
  for (const t of CARD_TYPE_ORDER) {
    const id = s[t];
    if (!id) continue;
    const card = deck.find((c) => c.id === id);
    parts.push(card ? card.name : id);
  }
  return parts.join(" / ");
}

export function cardName(deck: CardDef[], id: string): string {
  return deck.find((c) => c.id === id)?.name ?? id;
}
