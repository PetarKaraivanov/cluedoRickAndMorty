import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "./providers/AppProviders";

export const metadata: Metadata = {
  title: "Rick & Morty Cluedo",
  description: "A friends-only Rick & Morty themed Cluedo-style game.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
