import type { GameState, Player, LogEntry, CardDef } from "./types";

class RoomStore {
  private rooms = new Map<string, GameState>();
  private socketToRoom = new Map<string, { roomId: string; playerId: string }>();

  room(roomId: string): GameState | undefined {
    return this.rooms.get(roomId);
  }

  create(room: GameState): void {
    this.rooms.set(room.id, room);
  }

  delete(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      for (const p of room.players) {
        this.socketToRoom.delete(p.id);
      }
    }
    this.rooms.delete(roomId);
  }

  bindSocket(socketId: string, roomId: string, playerId: string): void {
    this.socketToRoom.set(socketId, { roomId, playerId });
  }

  lookupSocket(socketId: string): { roomId: string; playerId: string } | undefined {
    return this.socketToRoom.get(socketId);
  }

  unbindSocket(socketId: string): void {
    this.socketToRoom.delete(socketId);
  }

  all(): IterableIterator<GameState> {
    return this.rooms.values();
  }

  cleanupStale(maxAgeMs: number): void {
    const now = Date.now();
    for (const room of this.rooms.values()) {
      const lastSeen = Math.max(...room.players.map((p) => p.lastSeenAt), room.createdAt);
      if (now - lastSeen > maxAgeMs && room.players.length === 0) {
        this.delete(room.id);
      }
    }
  }
}

export const store = new RoomStore();

let logCounter = 0;
export function makeLog(kind: LogEntry["kind"], text: string): LogEntry {
  return { id: `log-${Date.now()}-${logCounter++}`, ts: Date.now(), kind, text };
}

export function addPlayer(room: GameState, player: Player): void {
  room.players.push(player);
}

export function findPlayer(room: GameState, playerId: string): Player | undefined {
  return room.players.find((p) => p.id === playerId);
}

export function removePlayer(room: GameState, playerId: string): void {
  const idx = room.players.findIndex((p) => p.id === playerId);
  if (idx >= 0) room.players.splice(idx, 1);
}

export function allDeckCards(room: GameState): CardDef[] {
  return room.deck;
}

export function generateRoomCode(): string {
  // 6 chars, no ambiguous chars (no O/0/I/1/L)
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
