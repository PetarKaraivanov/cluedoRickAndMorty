"use client";

import { useMemo } from "react";
import type { ClientGameState } from "@/lib/types";
import { CARD_TYPES, CARD_TYPE_LABELS, useDeckOptions } from "./useDeckOptions";

export function Notepad({ state }: { state: ClientGameState }) {
  const options = useDeckOptions(state);
  const myHandIds = useMemo(() => new Set(state.myHand.map((c) => c.id)), [state.myHand]);
  const seenIds = useMemo(() => new Set(state.mySeenCards), [state.mySeenCards]);

  return (
    <section className="panel notepad">
      <h2 className="panel-title">Detective notepad</h2>
      <p className="muted">Cards you hold or have seen are ticked. Use this to narrow down the envelope.</p>
      <div className="notepad-grid">
        {state.config.cardTypes.map((t) => (
          <div key={t} className="notepad-column">
            <h4 className="picker-label">{CARD_TYPE_LABELS[t]}</h4>
            <ul className="notepad-list">
              {options[t].map((c) => {
                const mine = myHandIds.has(c.id);
                const seen = seenIds.has(c.id);
                return (
                  <li
                    key={c.id}
                    className={`notepad-row ${mine ? "mine" : ""} ${seen ? "seen" : ""}`}
                  >
                    <span className="notepad-check">{mine || seen ? "x" : ""}</span>
                    <span className="notepad-name">{c.name}</span>
                    <span className="notepad-tag">
                      {mine ? "(yours)" : seen ? "(seen)" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
