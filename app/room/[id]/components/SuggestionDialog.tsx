"use client";

import { useState } from "react";
import type { CardTypeId, ClientGameState, Suggestion } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { Card } from "@/components/Card";
import { CARD_TYPES, CARD_TYPE_LABELS, useDeckOptions } from "./useDeckOptions";

interface Props {
  open: boolean;
  state: ClientGameState;
  onClose: () => void;
  onSubmit: (s: Suggestion) => void;
}

export function SuggestionDialog({ open, state, onClose, onSubmit }: Props) {
  const options = useDeckOptions(state);
  const [pick, setPick] = useState<Suggestion>({});

  function set(t: CardTypeId, id: string) {
    setPick((p) => ({ ...p, [t]: id }));
  }

  function submit() {
    onSubmit(pick);
    setPick({});
  }

  const complete = state.config.cardTypes.every((t) => pick[t]);

  return (
    <Modal
      open={open}
      title="Make a suggestion"
      onClose={() => {
        setPick({});
        onClose();
      }}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!complete} onClick={submit}>
            Suggest
          </button>
        </>
      }
    >
      <p className="muted">
        Pick one of each type. If another player has any matching card, they must secretly show one to you.
      </p>
      {state.config.cardTypes.map((t) => (
        <div key={t} className="picker-row">
          <h4 className="picker-label">{CARD_TYPE_LABELS[t]}</h4>
          <div className="picker-grid">
            {options[t].map((c) => (
              <Card
                key={c.id}
                card={c}
                size="sm"
                selected={pick[t] === c.id}
                onClick={() => set(t, c.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}
