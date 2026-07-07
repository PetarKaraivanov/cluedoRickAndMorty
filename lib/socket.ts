import type { Server as HTTPServer } from "http";
import { Server as IOServer, type Socket } from "socket.io";
import type { GameState, ClientGameState, Player, RoomConfig, Suggestion } from "./types";
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
  buildDeck,
  defaultConfig,
  endTurn,
  revealCard,
  startGame,
  suggest,
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
  ACCUSE: "game:accusation",
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
    ready: p.ready,
    handCount: p.hand.length,
    eliminated: p.eliminated,
    isMe: p.id === playerId,
    connected: p.lastSeenAt > 0,
  }));
  const me = room.players.find((p) => p.id === playerId);
  const revealedToMe =
    room.activeSuggestion?.revealedCardId &&
    room.activeSuggestion.suggesterId === playerId
      ? room.activeSuggestion.revealedCardId
      : null;

  const suggesterPlayer = room.activeSuggestion
    ? room.players.find((p) => p.id === room.activeSuggestion!.suggesterId)
    : null;
  const revealingPlayer = room.activeSuggestion?.revealingPlayerId
    ? room.players.find((p) => p.id === room.activeSuggestion!.revealingPlayerId)
    : null;

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
    activeSuggestion: room.activeSuggestion
      ? {
          suggesterId: room.activeSuggestion.suggesterId,
          suggesterName: suggesterPlayer?.name ?? "Unknown",
          suggestion: room.activeSuggestion.suggestion,
          revealingPlayerId: room.activeSuggestion.revealingPlayerId,
          revealingPlayerName: revealingPlayer?.name ?? null,
          revealedCardId: room.activeSuggestion.revealedCardId,
          revealedToMe,
        }
      : null,
    log: room.log,
    winner: room.winner,
    winnerName: room.winner ? room.players.find((p) => p.id === room.winner)?.name ?? null : null,
    revealedEnvelope: room.phase === "finished" ? room.envelope : null,
  };
}

function broadcastState(room: GameState): void {
  if (!io) return;
  for (const p of room.players) {
    if (p.lastSeenAt > 0) {
      io.to(p.id).emit(SOCK_EVENTS.STATE, makeClientView(room, p.id));
    }
  }
}

function createRoom(hostName: string, hostSocketId: string): GameState {
  const id = generateRoomCode();
  const host: Player = {
    id: hostSocketId,
    name: hostName.slice(0, 24) || "Host",
    isHost: true,
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

/** Reconnect a player by reseating their socket id. */
function reseat(room: GameState, player: Player, newSocketId: string): void {
  const oldId = player.id;
  store.unbindSocket(oldId);
  player.id = newSocketId;
  store.bindSocket(newSocketId, room.id, newSocketId);
  player.lastSeenAt = Date.now();

  // Also update any references in activeSuggestion queues
  if (room.activeSuggestion) {
    if (room.activeSuggestion.suggesterId === oldId) {
      room.activeSuggestion.suggesterId = newSocketId;
    }
    if (room.activeSuggestion.revealingPlayerId === oldId) {
      room.activeSuggestion.revealingPlayerId = newSocketId;
    }
    room.activeSuggestion.revealQueue = room.activeSuggestion.revealQueue.map((id) =>
      id === oldId ? newSocketId : id,
    );
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
      broadcastState(room);
    });

    socket.on(SOCK_EVENTS.SUGGEST, (payload: Suggestion) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = suggest(room, lookup.playerId, payload);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastState(room);
    });

    socket.on(SOCK_EVENTS.REVEAL, (payload: { cardId: string | null }) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = revealCard(room, lookup.playerId, payload.cardId);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastState(room);
    });

    socket.on(SOCK_EVENTS.ACCUSE, (payload: Suggestion) => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = accuse(room, lookup.playerId, payload);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastState(room);
    });

    socket.on(SOCK_EVENTS.END_TURN, () => {
      const lookup = store.lookupSocket(socket.id);
      if (!lookup) return;
      const room = store.room(lookup.roomId);
      if (!room) return;
      const err = endTurn(room, lookup.playerId);
      if (err) socket.emit(SOCK_EVENTS.ERROR, err);
      else broadcastState(room);
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
