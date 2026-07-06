"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoom, useSocket } from "@/app/providers/SocketProvider";

function WaitingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const name = params.get("name") || "";
  const mode = (params.get("mode") as "create" | "join") || "create";
  const roomId = params.get("roomId") || undefined;

  const { join, state, error, joinedRoomId } = useRoom();
  const { connected } = useSocket();

  // Fire the join exactly once when this page mounts.
  useEffect(() => {
    if (!name) {
      router.replace("/lobby");
      return;
    }
    join({ name, mode, roomId });
    // We intentionally only fire on initial mount; the provider remembers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the server gives us a room id, navigate to the persistent room URL.
  useEffect(() => {
    if (joinedRoomId) {
      router.replace(`/room/${joinedRoomId}`);
    }
  }, [joinedRoomId, router]);

  return (
    <main className="lobby-shell">
      <div className="portal-bg" aria-hidden />
      <div className="lobby-card">
        <h1 className="lobby-title">Wubba lubba dub dub</h1>
        <p className="lobby-help">
          {error
            ? error
            : !connected
              ? "Connecting to the portal..."
              : !joinedRoomId
                ? "Knocking on the door of the multiverse..."
                : `Room ${joinedRoomId} ready, taking you there...`}
        </p>
        {error && (
          <button className="btn btn-primary" onClick={() => router.push("/lobby")}>
            Back to lobby
          </button>
        )}
      </div>
    </main>
  );
}

export default function WaitingPage() {
  return (
    <Suspense
      fallback={
        <div className="lobby-shell">
          <div className="lobby-card">
            <p className="lobby-help">Loading...</p>
          </div>
        </div>
      }
    >
      <WaitingInner />
    </Suspense>
  );
}
