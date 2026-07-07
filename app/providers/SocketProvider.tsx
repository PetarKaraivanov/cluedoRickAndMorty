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

// localStorage keys for persistent reconnection (survives refresh & tab close)
const STORAGE_KEY_NAME = "cluedo_player_name";
const STORAGE_KEY_ROOM = "cluedo_room_id";

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
  reconnecting: boolean;
  join: (args: { name: string; mode: "create" | "join"; roomId?: string }) => void;
  reset: () => void;
  clearError: () => void;
}

const RoomContext = createContext<RoomContextValue>({
  state: null,
  error: null,
  joinedRoomId: null,
  reconnecting: true,
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
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
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
 *
 * Reconnection strategy:
 * - On successful join, we persist { name, roomId } in localStorage (not sessionStorage).
 *   This means even closing the tab and reopening still remembers the session.
 * - When the socket connects/reconnects, we emit REJOIN with the stored name + roomId.
 * - The `reconnecting` flag prevents premature redirect to /lobby while we're
 *   still trying to rejoin.
 */
export function RoomSessionProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [state, setState] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(true);
  const hasAttemptedRejoin = useRef(false);
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

  // On socket connect/reconnect: try to rejoin if we have stored session data
  useEffect(() => {
    if (!socket) return;

    function onConnect() {
      // Check if we have a pending initial join
      const pending = pendingJoin.current;
      if (pending && !pending.fired) {
        pending.fired = true;
        socket!.emit(
          SOCK_EVENTS.JOIN,
          { mode: pending.mode, roomId: pending.roomId, name: pending.name },
          (ack: { ok: boolean; roomId?: string; error?: string }) => {
            if (!ack.ok) {
              setError(ack.error || "Failed to join room.");
            } else {
              // Persist for reconnection in localStorage
              try {
                localStorage.setItem(STORAGE_KEY_NAME, pending.name);
                if (ack.roomId) localStorage.setItem(STORAGE_KEY_ROOM, ack.roomId);
              } catch {}
            }
            setReconnecting(false);
          },
        );
        return;
      }

      // Otherwise try to reconnect using stored session
      try {
        const storedName = localStorage.getItem(STORAGE_KEY_NAME);
        const storedRoom = localStorage.getItem(STORAGE_KEY_ROOM);
        if (storedName && storedRoom && !hasAttemptedRejoin.current) {
          hasAttemptedRejoin.current = true;
          socket!.emit(
            SOCK_EVENTS.REJOIN,
            { roomId: storedRoom, name: storedName },
            (ack: { ok: boolean; error?: string }) => {
              if (!ack.ok) {
                // Session is stale, clear it
                localStorage.removeItem(STORAGE_KEY_NAME);
                localStorage.removeItem(STORAGE_KEY_ROOM);
              }
              hasAttemptedRejoin.current = false;
              setReconnecting(false);
            },
          );
        } else {
          // Nothing to rejoin
          setReconnecting(false);
        }
      } catch {
        setReconnecting(false);
      }
    }

    socket.on("connect", onConnect);
    // If already connected, fire immediately
    if (socket.connected) {
      onConnect();
    }
    return () => {
      socket.off("connect", onConnect);
    };
  }, [socket]);

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
        // Persist for reconnection in localStorage
        try {
          localStorage.setItem(STORAGE_KEY_NAME, name);
          if (ack.roomId) localStorage.setItem(STORAGE_KEY_ROOM, ack.roomId);
        } catch {}
      },
    );
  }, [socket]);

  const reset = useCallback(() => {
    pendingJoin.current = null;
    setState(null);
    setJoinedRoomId(null);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY_NAME);
      localStorage.removeItem(STORAGE_KEY_ROOM);
    } catch {}
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ state, error, joinedRoomId, reconnecting, join, reset, clearError }),
    [state, error, joinedRoomId, reconnecting, join, reset, clearError],
  );
  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
