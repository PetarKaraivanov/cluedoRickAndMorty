"use client";

import type { CardDef } from "@/lib/types";
import { Card } from "@/components/Card";

export function PlayerHand({ cards, seenIds }: { cards: CardDef[]; seenIds: string[] }) {
  const seenSet = new Set(seenIds);
  return (
    <section className="hand">
      <h3 className="section-h">Your hand</h3>
      {cards.length === 0 ? (
        <p className="muted">No cards yet.</p>
      ) : (
        <div className="hand-row">
          {cards.map((c) => (
            <Card key={c.id} card={c} size="sm" label={seenSet.has(c.id) ? "YOURS" : undefined} />
          ))}
        </div>
      )}
    </section>
  );
}
