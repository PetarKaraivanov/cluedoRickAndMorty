"use client";

import { useMemo } from "react";
import type { CardDef, CardTypeId, ClientGameState } from "@/lib/types";
import { CARD_TYPES, CARD_TYPE_LABELS } from "@/lib/types";
import { ALL_CARDS } from "@/lib/cards";

export function useDeckOptions(state: ClientGameState): Record<CardTypeId, CardDef[]> {
  return useMemo(() => {
    const out: Record<CardTypeId, CardDef[]> = {
      person: [],
      location: [],
      weapon: [],
      motive: [],
      time: [],
    };
    for (const t of CARD_TYPES) {
      if (!state.config.cardTypes.includes(t)) continue;
      const max = state.config.maxPerType[t] ?? 0;
      out[t] = ALL_CARDS.filter((c) => c.type === t).slice(0, max);
    }
    return out;
  }, [state.config]);
}

export { CARD_TYPES, CARD_TYPE_LABELS };
