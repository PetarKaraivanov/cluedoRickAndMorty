import type { ClientGameState, ClientPlayerView, GameState, LogEntry, Player, RoomConfig, Suggestion, TurnStage } from "./types";

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

export type {
  ClientGameState,
  ClientPlayerView,
  GameState,
  LogEntry,
  Player,
  RoomConfig,
  Suggestion,
  TurnStage,
};
