"use client";

import type { LogEntry } from "@/lib/types";

const KIND_ICON: Record<LogEntry["kind"], string> = {
  system: "*",
  turn: ">",
  suggestion: "?",
  reveal: "!",
  accusation: "X",
  win: "=",
  elimination: "-",
};

export function GameLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section className="panel log-panel">
      <h2 className="panel-title">Game log</h2>
      <ul className="log-list">
        {entries.map((e) => (
          <li key={e.id} className={`log-entry log-${e.kind}`}>
            <span className="log-icon">{KIND_ICON[e.kind]}</span>
            <span className="log-text">{e.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
