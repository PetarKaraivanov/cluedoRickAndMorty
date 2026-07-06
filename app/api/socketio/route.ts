import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The actual Socket.io server lives on the same HTTP server as Next.js
// (see server.js). This route exists so the /api/socketio path resolves
// inside Next's router; the WebSocket upgrade is intercepted by Socket.io
// directly. We just acknowledge any HTTP request reaching here.
export async function GET() {
  return NextResponse.json({ ok: true, service: "socketio" });
}

export async function POST() {
  return NextResponse.json({ ok: true, service: "socketio" });
}
