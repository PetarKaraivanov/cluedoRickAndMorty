"use client";

import type { ReactNode } from "react";
import { SocketProvider, RoomSessionProvider } from "./SocketProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SocketProvider>
      <RoomSessionProvider>{children}</RoomSessionProvider>
    </SocketProvider>
  );
}
