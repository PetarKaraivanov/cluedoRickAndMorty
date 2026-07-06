"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ClientGameState } from "@/lib/types";
import { SOCK_EVENTS } from "@/lib/socket-events";

type Socket = import("socket.io-client").Socket;

// ---------- Socket connection (lives for the whole browser session) ----------

const SocketContext = createContext<{
  socket: Socket | null;
  connected: boolean;
}>({ socket: null, connected: false });

// ---------- Active room (survives route changes within a session) ----------

interface RoomContextValue {
  state: ClientGameState | null;
  error: string | null;
  joinedRoomId: string | null;
  join: (args: { name: string; mode: "create" | "join"; roomId?: string }) => void;
  reset: () => void;
  clearError: () => void;
}

const RoomContext = createContext<RoomContextValue>({
  state: null,
  error: null,
  joinedRoomId: null,
  join: () => {},
  reset: () => {},
  clearError: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

export function useRoom() {
  return useContext(RoomContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    let s: Socket | null = null;
    (async () => {
      const { io } = await import("socket.io-client");
      if (!active) return;
      s = io({
        path: "/api/socketio",
        transports: ["websocket", "polling"],
        reconnection: true,
      });
      s.on("connect", () => setConnected(true));
      s.on("disconnect", () => setConnected(false));
      setSocket(s);
    })();
    return () => {
      active = false;
      if (s) s.close();
    };
  }, []);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/**
 * Wraps the whole app and holds the active room state. Lives in the root layout
 * so navigating between /room/waiting and /room/[id] does NOT re-trigger a
 * socket join or wipe local state.
 */
export function RoomSessionProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [state, setState] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const pendingJoin = useRef<{
    name: string;
    mode: "create" | "join";
    roomId?: string;
    fired: boolean;
  } | null>(null);

  // Listen for room state + errors as long as we have a socket.
  useEffect(() => {
    if (!socket) return;
    function onState(s: ClientGameState) {
      setState(s);
      setJoinedRoomId(s.id);
    }
    function onErr(msg: string) {
      setError(msg);
    }
    socket.on(SOCK_EVENTS.STATE, onState);
    socket.on(SOCK_EVENTS.ERROR, onErr);
    return () => {
      socket.off(SOCK_EVENTS.STATE, onState);
      socket.off(SOCK_EVENTS.ERROR, onErr);
    };
  }, [socket]);

  // Whenever the socket (re)connects and we have a pending or prior join, fire it.
  useEffect(() => {
    if (!socket || !socket.connected) return;
    // If we already have a joined room, the server tracks us by socket.id, so
    // reconnection should restore state via the server's broadcast on reconnect.
    // Only fire a fresh join if we have a pending request that hasn't been sent.
    const pending = pendingJoin.current;
    if (pending && !pending.fired) {
      pending.fired = true;
      socket.emit(
        SOCK_EVENTS.JOIN,
        { mode: pending.mode, roomId: pending.roomId, name: pending.name },
        (ack: { ok: boolean; roomId?: string; error?: string }) => {
          if (!ack.ok) {
            setError(ack.error || "Failed to join room.");
          }
        },
      );
    }
  }, [socket, socket?.connected]);

  const join = useCallback<RoomContextValue["join"]>(({ name, mode, roomId }) => {
    if (!socket) {
      setError("Connecting to server...");
      pendingJoin.current = { name, mode, roomId, fired: false };
      return;
    }
    pendingJoin.current = { name, mode, roomId, fired: false };
    setError(null);
    socket.emit(
      SOCK_EVENTS.JOIN,
      { mode, roomId, name },
      (ack: { ok: boolean; roomId?: string; error?: string }) => {
        if (!ack.ok) {
          setError(ack.error || "Failed to join room.");
          return;
        }
        pendingJoin.current!.fired = true;
      },
    );
  }, [socket]);

  const reset = useCallback(() => {
    pendingJoin.current = null;
    setState(null);
    setJoinedRoomId(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ state, error, joinedRoomId, join, reset, clearError }),
    [state, error, joinedRoomId, join, reset, clearError],
  );
  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
