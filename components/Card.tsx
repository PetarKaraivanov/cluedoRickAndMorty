"use client";

import { useState } from "react";
import type { CardDef } from "@/lib/types";
import { UI_IMAGES } from "@/lib/cards";

const TYPE_ACCENT: Record<CardDef["type"], string> = {
  person: "var(--accent-person)",
  location: "var(--accent-location)",
  weapon: "var(--accent-weapon)",
  motive: "var(--accent-motive)",
  time: "var(--accent-time)",
};

const TYPE_LABEL: Record<CardDef["type"], string> = {
  person: "WHO",
  location: "WHERE",
  weapon: "HOW",
  motive: "WHY",
  time: "WHEN",
};

interface CardProps {
  card: CardDef;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
  back?: boolean;
  label?: string;
}

export function Card({ card, size = "md", selected, onClick, back, label }: CardProps) {
  const [broken, setBroken] = useState(false);
  const accent = TYPE_ACCENT[card.type];
  const isInteractive = !!onClick;

  return (
    <button
      type="button"
      className={`card size-${size} ${selected ? "selected" : ""} ${isInteractive ? "interactive" : ""}`}
      onClick={onClick}
      style={{ ["--accent" as string]: accent }}
    >
      <div className="card-inner">
        <div className="card-accent-bar" />
        {back ? (
          <div className="card-back" style={{ backgroundImage: `url(${UI_IMAGES.cardBack})` }}>
            <span className="card-back-rune">?</span>
          </div>
        ) : (
          <div className="card-face">
            {!broken ? (
              <img
                src={card.image}
                alt={card.name}
                className="card-image"
                onError={() => setBroken(true)}
              />
            ) : (
              <div className="card-image card-image-placeholder" style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }}>
                <span>{card.name}</span>
              </div>
            )}
            <div className="card-meta">
              <span className="card-type">{label || TYPE_LABEL[card.type]}</span>
              <span className="card-name">{card.name}</span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
