// Force this segment to be server-rendered on demand.
// The /room/[id] page is a fully client-driven experience (socket state),
// so there's nothing to statically pre-render. This also avoids a known
// interaction between tsx (used by server.js) and Next's static-paths worker.
export const dynamic = "force-dynamic";

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
