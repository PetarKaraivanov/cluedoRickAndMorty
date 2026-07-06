import { NextResponse } from "next/server";
import { clearSessionCookie, makeSessionCookie, verifyPassword, verifyRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", makeSessionCookie());
  return NextResponse.json({ ok: true }, { headers });
}

export async function DELETE(req: Request) {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", clearSessionCookie());
  return NextResponse.json({ ok: true }, { headers });
}

export async function GET(req: Request) {
  return NextResponse.json({ authed: verifyRequest(req) });
}
