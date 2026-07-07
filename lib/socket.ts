import type { Server as HTTPServer } from "http";
import { Server as IOServer, type Socket } from "socket.io";
import type { GameState, ClientGameState, ClientActiveSuggestion, Player, RoomConfig, Suggestion } from "./types";
import {
  addPlayer,
  findPlayer,
  findPlayerByName,
  generateRoomCode,
  makeLog,
  removePlayer,
  store,
} from "./store";
import {
  accuse,
  botPickRevealCard,
  botRandomSuggestion,
  buildDeck,
  defaultConfig,
  endTurn,
  nextBotName,
  pickOpponent,
  revealCard,
  startGame,
  suggest,
  surrender,
  validateConfig,
  MAX_PLAYERS,
} from "./engine";

export const SOCK_EVENTS = {
  JOIN: "room:join",
  REJOIN: "room:rejoin",
  STATE: "room:state",
  READY: "player:ready",
  CONFIG: "host:config",
  START: "host:start",
  END_TURN: "game:turn-end",
  SUGGEST: "game:suggestion",
  REVEAL: "game:reveal",
  PICK_OPPONENT: "game:pick-opponent",
  ACCUSE: "game:accusation",
  ADD_BOT: "host:add-bot",
  REMOVE_BOT: "host:remove-bot",
  SURRENDER: "player:surrender",
  LOG: "game:log",
  ERROR: "room:error",
  LEFT: "room:left",
} as const;

let io: IOServer | null = null;

export function getIO(): IOServer | null {
  return io;
}

export function initIO(httpServer: HTTPServer): IOServer {
  if (io) return io;
  io = new IOServer(httpServer, {
    path: "/api/socketio",
    cors: { origin: "*", methods: ["GET", "POST"] },
    addTrailingSlash: false,
    pingInterval: 10000,
    pingTimeout: 20000,
  });
  attachHandlers(io);
  return io;
}

function makeClientView(room: GameState, playerId: string): ClientGameState {
  const players: ClientGameState["players"] = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    isBot: p.isBot,
    ready: p.ready,
    handCount: p.hand.length,
    eliminated: p.eliminated,
    isMe: p.id === playerId,
    connected: p.isBot ? true : p.lastSeenAt > 0,
  }));
  const me = room.players.find((p) => p.id === playerId);

  // Build client-side active suggestion view
  let clientActiveSuggestion: ClientActiveSuggestion | null = null;
  if (room.activeSuggestion) {
    const active = room.activeSuggestion;
    const suggesterPlayer = room.players.find((p) => p.id === active.suggesterId);
    const iAmSuggester = active.suggesterId === playerId;

    // Do I need to respond?
    const iMustRespond = active.revealQueue.includes(playerId) &&
      active.opponentResponses[playerId] === undefined;

    // Are we waiting for responses?
    const waitingForResponses = !active.allResponded;

    // Opposing players (only populated once all have responded)
    const opposingPlayers = active.opposingPlayerIds.map((id) => ({
      id,
      name: room.players.find((p) => p.id === id)?.name ?? "?",
    }));

    // The chosen opponent info
    const chosenOpponent = active.chosenOpponentId
      ? room.players.find((p) => p.id === active.chosenOpponentId)
      : null;

    // Revealed card — only the suggester sees it
    const revealedToMe = iAmSuggester && active.revealedCardId
      ? active.revealedCardId
      : null;

    clientActiveSuggestion = {
      suggesterId: active.suggesterId,
      suggesterName: suggesterPlayer?.name ?? "Unknown",
      suggestion: active.suggestion,
      iMustRespond,
      waitingForResponses,
      opposingPlayers,
      pickingOpponent: room.turnStage === "picking-opponent",
      chosenOpponentId: active.chosenOpponentId,
      chosenOpponentName: chosenOpponent?.name ?? null,
      revealedCardId: active.revealedCardId,
      revealedToMe,
      resolved: active.resolved,
      noOneOpposed: active.allResponded && active.opposingPlayerIds.length === 0,
    };
  }

  // Build per-player suggestion history — only the suggester sees revealedCardId
  const suggestionHistory = (room.suggestionHistory ?? []).map((entry) => ({
    ...entry,
    revealedCardId: entry.suggesterId === playerId ? entry.revealedCardId : null,
  }));

  return {
    id: room.id,
    phase: room.phase,
    config: room.config,
    players,
    myHand: me?.hand ?? [],
    mySeenCards: me?.seenCards ?? [],
    currentTurnIdx: room.currentTurnIdx,
    currentTurnPlayerId: room.players[room.currentTurnIdx]?.id ?? null,
    turnStage: room.turnStage,
    hasSuggested: room.hasSuggested,
    activeSuggestion: clientActiveSuggestion,
    suggestionHistory,
    log: room.log,
    winner: room.winner,
    winnerName: room.winner ? room.players.find((p) => p.id === room.winner)?.name ?? null : null,
    revealedEnvelope: room.phase === "finished" ? room.envelope : null,
  };
}

function broadcastState(room: GameState): void {
  if (!io) return;
  for (const p of room.players) {
    if (!p.isBot && p.lastSeenAt > 0) {
      io.to(p.id).emit(SOCK_EVENTS.STATE, makeClientView(room, p.id));
    }
  }
}

/**
 * After every state change, check if a bot needs to act and schedule it
 * with a short delay so human clients see the state transitions.
 */
const BOT_DELAY_MS = 1200;
const pendingBotTimers = new Set<ReturnType<typeof setTimeout>>();

function scheduleBotActions(room: GameState): void {
  if (room.phase !== "playing") return;

  const timer = setTimeout(() => {
    pendingBotTimers.delete(timer);
    // Re-fetch the room in case it was deleted
    const current = store.room(room.id);
    if (!current || current.phase !== "playing") return;
    processBotActions(current);
  }, BOT_DELAY_MS);
  pendingBotTimers.add(timer);
}

function processBotActions(room: GameState): void {
  // 1) Is it a bot's turn to suggest?
  const currentPlayer = room.players[room.currentTurnIdx];
  if (currentPlayer?.isBot && !currentPlayer.eliminated && room.turnStage === "awaiting-turn" && !room.hasSuggested) {
    const suggestion = botRandomSuggestion(room);
    const err = suggest(room, currentPlayer.id, suggestion);
    if (!err) {
      broadcastState(room);
      scheduleBotActions(room);
      return;
    }
  }

  // 2) Are there bots that need to respond to a reveal?
  if (room.activeSuggestion && !room.activeSuggestion.allResponded) {
    const active = room.activeSuggestion;
    let botActed = false;
    for (const botId of active.revealQueue) {
      if (active.opponentResponses[botId] !== undefined) continue;
      const bot = room.players.find((p) => p.id === botId);
      if (!bot?.isBot) continue;
      const cardId = botPickRevealCard(bot, active.suggestion);
      const err = revealCard(room, botId, cardId);
      if (!err) botActed = true;
    }
    if (botActed) {
      broadcastState(room);
      scheduleBotActions(room);
      return;
    }
  }

  // 3) Is a bot the suggester and needs to pick an opponent?
  if (room.turnStage === "picking-opponent" && room.activeSuggestion) {
    const active = room.activeSuggestion;
    const suggester = room.players.find((p) => p.id === active.suggesterId);
    if (suggester?.isBot && active.opposingPlayerIds.length > 0) {
      // Bot picks a random opponent
      const randomOpponent = active.opposingPlayerIds[
        Math.floor(Math.random() * active.opposingPlayerIds.length)
      ];
      const err = pickOpponent(room, active.suggesterId, randomOpponent);
      if (!err) {
        broadcastState(room);
        scheduleBotActions(room);
        return;
      }
    }
  }

  // 4) Is it a bot's turn and the suggestion resolved? Auto-end turn (bots never accuse)
  if (currentPlayer?.isBot && !currentPlayer.eliminated && room.turnStage === "accuse-or-end") {
    const err = endTurn(room, currentPlayer.id);
    if (!err) {
      broadcastState(room);
      scheduleBotActions(room);
      return;
    }
  }
}

/** Broadcast + schedule bot actions + reset inactivity timer. */
function broadcastAndBot(room: GameState): void {
  broadcastState(room);
  scheduleBotActions(room);
  scheduleInactivityTimer(room);
}

// ---------- Inactivity auto-surrender (4 minutes) ----------

const INACTIVITY_MS = 4 * 60 * 1000; // 4 minutes
const inactivityTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleInactivityTimer(room: GameState): void {
  // Clear any existing timer for this room
  const existing = inactivityTimers.get(room.id);
  if (existing) clearTimeout(existing);
  inactivityTimers.delete(room.id);

  if (room.phase !== "playing") return;

  const currentPlayer = room.players[room.currentTurnIdx];
  // Only set timer for human players
  if (!currentPlayer || currentPlayer.isBot || currentPlayer.eliminated) return;

  const timer = setTimeout(() => {
    inactivityTimers.delete(room.id);
    const current = store.room(room.id);
    if (!current || current.phase !== "playing") return;
    const player = current.players[current.currentTurnIdx];
    if (!player || player.isBot || player.eliminated) return;
    // Auto-surrender
    const err = surrender(current, player.id);
    if (!err) {
      current.log.unshift(makeLog("system", `⏰ ${player.name} was auto-surrendered due to inactivity.`));
      broadcastAndBot(current);
    }
  }, INACTIVITY_MS);
  inactivityTimers.set(room.id, timer);
}

function createRoom(hostName: string, hostSocketId: string): GameState {
  const id = generateRoomCode();
  const host: Player = {
    id: hostSocketId,
    name: hostName.slice(0, 24) || "Host",
    isHost: true,
    isBot: false,
    ready: false,
    hand: [],
    eliminated: false,
    seenCards: [],
    lastSeenAt: Date.now(),
  };
  const room: GameState = {
    id,
    phase: "waiting",
    config: defaultConfig(),
    players: [],
    deck: buildDeck(defaultConfig()),
    envelope: {},
    currentTurnIdx: 0,
    turnStage: "awaiting-turn",
    hasSuggested: false,
    activeSuggestion: null,
    suggestionHistory: [],
    log: [makeLog("system", `Room ${id} created.`)],
    winner: null,
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
  };
  addPlayer(room, host);
  store.create(room);
  store.bindSocket(hostSocketId, id, host.id);
  return room;
}

function joinRoom(room: GameState, name: string, socketId: string): { error?: string; player?: Player } {
  if (room.phase !== "waiting") return { error: "Game already started." };
  if (room.players.length >= MAX_PLAYERS) return { error: "Room is full." };
  if (room.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return { error: "Name already taken in this room." };
  }
  const player: Player = {
    id: socketId,
    name: name.slice(0, 24) || "Player",
    isHost: false,
    isBot: false,
    ready: false,
    hand: [],
    eliminated: false,
    seenCards: [],
    lastSeenAt: Date.now(),
  };
  addPlayer(room, player);
  store.bindSocket(socketId, room.id, player.id);
  room.log.unshift(makeLog("system", `${player.name} joined.`));
  return { player };
}

let botIdCounter = 0;

function addBot(room: GameState): { error?: string; bot?: Player } {
  if (room.phase !== "waiting") return { error: "Game already started." };
  if (room.players.length >= MAX_PLAYERS) return { error: "Room is full." };
  const name = nextBotName();
  const botId = `bot-${Date.now()}-${botIdCounter++}`;
  const bot: Player = {
    id: botId,
    name,
    isHost: false,
    isBot: true,
    ready: true, // Bots are always ready
    hand: [],
    eliminated: false,
    seenCards: [],
    lastSeenAt: Date.now(),
  };
  addPlayer(room, bot);
  room.log.unshift(makeLog("system", `🤖 ${name} (bot) joined.`));
  return { bot };
}

function removeBot(room: GameState, botId: string): string | null {
  if (room.phase !== "waiting") return "Game already started.";
  const bot = room.players.find((p) => p.id === botId && p.isBot);
  if (!bot) return "Bot not found.";
  removePlayer(room, botId);
  room.log.unshift(makeLog("system", `🤖 ${bot.name} removed.`));
  return null;
}

/** Reconnect a player by reseating their socket id. */
function reseat(room: GameState, player: Player, newSocketId: string): void {
  const oldId = player.id;
  store.unbindSocket(oldId);
  player.id = newSocketId;
  store.bindSocket(newSocketId, room.id, newSocketId);
  player.lastSeenAt = Date.now();

  // Also update any references in activeSuggestion
  if (room.activeSuggestion) {
    if (room.activeSuggestion.suggesterId === oldId) {
      room.activeSuggestion.suggesterId = newSocketId;
    }
    if (room.activeSuggestion.chosenOpponentId === oldId) {
      room.activeSuggestion.chosenOpponentId = newSocketId;
    }
    room.activeSuggestion.revealQueue = room.activeSuggestion.revealQueue.map((id) =>
      id === oldId ? newSocketId : id,
    );
    // Update opponent responses keys
    if (room.activeSuggestion.opponentResponses[oldId] !== undefined) {
      room.activeSuggestion.opponentResponses[newSocketId] = room.activeSuggestion.opponentResponses[oldId];
      delete room.activeSuggestion.opponentResponses[oldId];
    }
    // Update opposingPlayerIds
    room.activeSuggestion.opposingPlayerIds = room.activeSuggestion.opposingPlayerIds.map((id) =>
      id === oldId ? newSocketId : id,
    );
  }

  // Update suggestion history references
  for (const entry of room.suggestionHistory) {
    if (entry.suggesterId === oldId) entry.suggesterId = newSocketId;
    if (entry.chosenOpponentId === oldId) entry.chosenOpponentId = newSocketId;
    for (const op of entry.opposingPlayers) {
      if (op.id === oldId) op.id = newSocketId;
    }
  }
}

function attachHandlers(io: IOServer): void {
  io.on("connection", (socket: Socket) => {
    socket.on(SOCK_EVENTS.JOIN, (payload: { mode: "create" | "join"; roomId?: string; name: string }, ack?: (r: { ok: boolean; roomId?: string; error?: string }) => void) => {
      const name = (payload?.name ?? "").trim();
      if (!name) {
        ack?.({ ok: false, error: "Name required." });
        return;
      }
      if (payload.mode === "create") {
        const room = createRoom(name, socket.id);
        socket.join(room.id);
        ack?.({ ok: true, roomId: room.id });
        broadcastState(room);
        return;
      }
      const roomId = (payload.roomId ?? "").toUpperCase().trim();
      const room = store.room(roomId);
      if (!room) {
        ack?.({ ok: false, error: "Room not found." });
        return;
      }
      const res = joinRoom(room, name, socket.id);
      if (res.error) {
        ack?.({ ok: false, error: res.error });
        return;
      }
      socket.join(room.id);
      ack?.({ ok: true, roomId: room.id });
      broadcastState(room);
    });

    // Reconnection: client sends name + roomId to reclaim their seat
    socket.on(SOCK_EVENTS.REJOIN, (payload: { roomId: string; name: string }, ack?: (r: { ok: boolean; error?: string }) => void) => {
      const roomId = (payload?.roomId ?? "").toUpperCase().trim();
      const name = (payload?.name ?? "").trim();
      if (!roomId || !name) {
        ack?.({ ok: false, error: "Room ID and name required." });
        return;
      }
      const room = store.room(roomId);
      if (!room) {
        ack?.({ ok: false, error: "Room not found." });
        return;
      }
      const player = findPlayerByName(room, name);
      if (!player) {
        ack?.({ ok: false, error: "Player not found in this room." });
        return;
      }
      // Reseat: update the player's socket id
      reseat(room, player, socket.id);
      socket.join(room.id);
      room.log.unshift(makeLog("system", `${player.name} reconnected.`));
      ack?.({ ok: true });
      broadcastState(room);
    });

    socket.on(SOCK_EVENTS.READY, (payload: { ready: boolean }) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      const p = room && findPlayer(room, lookup.playerId);
      if (!room || !p) return;
      if (room.phase !== "waiting") return;
      p.ready = !!payload.ready;
      p.lastSeenAt = Date.now();
      broadcastState(room);
    });

    socket.on(SOCK_EVENTS.CONFIG, (payload: RoomConfig) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      const p = room && findPlayer(room, lookup.playerId);
      if (!room || !p || !p.isHost) return;
      if (room.phase !== "waiting") return;
      const err = validateConfig(payload);
      if (err) {
        socket.emit(SOCK_EVENTS.ERROR, err);
        return;
      }
      room.config = payload;
      room.deck = buildDeck(payload);
      broadcastState(room);
    });

    socket.on(SOCK_EVENTS.START, () => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      const p = room && findPlayer(room, lookup.playerId);
      if (!room || !p || !p.isHost) return;
      const err = startGame(room);
      if (err) {
        socket.emit(SOCK_EVENTS.ERROR, err);
        return;
      }
      broadcastAndBot(room);
    });

    socket.on(SOCK_EVENTS.SUGGEST, (payload: Suggestion) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = suggest(room, lookup.playerId, payload);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastAndBot(room);
    });

    socket.on(SOCK_EVENTS.REVEAL, (payload: { cardId: string | null }) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = revealCard(room, lookup.playerId, payload.cardId);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastAndBot(room);
    });

    socket.on(SOCK_EVENTS.PICK_OPPONENT, (payload: { opponentId: string }) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = pickOpponent(room, lookup.playerId, payload.opponentId);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastAndBot(room);
    });

    socket.on(SOCK_EVENTS.ACCUSE, (payload: Suggestion) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = accuse(room, lookup.playerId, payload);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastAndBot(room);
    });

    socket.on(SOCK_EVENTS.END_TURN, () => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = endTurn(room, lookup.playerId);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastAndBot(room);
    });

    // ---------- Bot management (host only) ----------

    socket.on(SOCK_EVENTS.ADD_BOT, (ack?: (r: { ok: boolean; error?: string }) => void) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) { ack?.({ ok: false, error: "Not in a room." }); return; }
      const room = store.room(lookup.roomId);
      const p = room && findPlayer(room, lookup.playerId);
      if (!room || !p || !p.isHost) { ack?.({ ok: false, error: "Only the host can add bots." }); return; }
      const res = addBot(room);
      if (res.error) { ack?.({ ok: false, error: res.error }); return; }
      ack?.({ ok: true });
      broadcastState(room);
    });

    socket.on(SOCK_EVENTS.REMOVE_BOT, (payload: { botId: string }, ack?: (r: { ok: boolean; error?: string }) => void) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) { ack?.({ ok: false, error: "Not in a room." }); return; }
      const room = store.room(lookup.roomId);
      const p = room && findPlayer(room, lookup.playerId);
      if (!room || !p || !p.isHost) { ack?.({ ok: false, error: "Only the host can remove bots." }); return; }
      const err = removeBot(room, payload.botId);
      if (err) { ack?.({ ok: false, error: err }); return; }
      ack?.({ ok: true });
      broadcastState(room);
    });

    // ---------- Surrender ----------

    socket.on(SOCK_EVENTS.SURRENDER, () => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = surrender(room, lookup.playerId);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastAndBot(room);
    });

    socket.on("disconnect", () => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      store.unbindSocket(socket.id);
      if (!room) return;
      const p = findPlayer(room, lookup.playerId);
      if (p && room.phase === "waiting") {
        removePlayer(room, lookup.playerId);
        room.log.unshift(makeLog("system", `${p.name} left.`));
        if (room.players.length === 0) {
          store.delete(room.id);
          return;
        }
      } else if (p) {
        // Mark as disconnected but keep player in game — they can rejoin
        p.lastSeenAt = 0;
        room.log.unshift(makeLog("system", `${p.name} disconnected.`));
      }
      broadcastState(room);
    });
  });
}
