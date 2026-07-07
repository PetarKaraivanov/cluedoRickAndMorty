"use client";

import { useEffect } from "react";
import { useRoom } from "@/app/providers/SocketProvider";
import { WaitingRoom } from "./components/WaitingRoom";
import { GameBoard } from "./components/GameBoard";
import { useRouter } from "next/navigation";

export default function RoomPage() {
  const router = useRouter();
  const { state, error, clearError, joinedRoomId, reconnecting } = useRoom();

  // Wait for reconnection to finish before deciding to redirect.
  // This prevents accidental redirects on refresh/tab reopen.
  useEffect(() => {
    if (reconnecting) return; // Still trying to rejoin — don't redirect yet
    if (!joinedRoomId) {
      router.replace("/lobby");
    }
  }, [joinedRoomId, reconnecting, router]);

  // While reconnecting, show a loading state instead of redirecting
  if (reconnecting) {
    return (
      <main className="lobby-shell">
        <div className="lobby-card">
          <h1 className="lobby-title">Reconnecting...</h1>
          <p className="lobby-help">Warping back through the portal...</p>
        </div>
      </main>
    );
  }

  if (!joinedRoomId) return null;

  if (error && !state) {
    return (
      <main className="lobby-shell">
        <div className="lobby-card">
          <h1 className="lobby-title">Schmeckle!</h1>
          <p className="lobby-help">{error}</p>
          <button className="btn btn-primary" onClick={() => router.push("/lobby")}>
            Back to lobby
          </button>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="lobby-shell">
        <div className="lobby-card">
          <p className="lobby-help">Loading room {joinedRoomId}...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="game-shell">
      {error && (
        <div className="floating-error" role="alert">
          <span>{error}</span>
          <button onClick={clearError} aria-label="dismiss">
            x
          </button>
        </div>
      )}
      <header className="game-header">
        <div className="game-header-left">
          <span className="logo-mini">Rick &amp; Morty · Cluedo</span>
        </div>
        <div className="game-header-right">
          <span className="room-code">Room {state.id}</span>
        </div>
      </header>
      {state.phase === "waiting" ? <WaitingRoom state={state} /> : <GameBoard state={state} />}
    </div>
  );
}
