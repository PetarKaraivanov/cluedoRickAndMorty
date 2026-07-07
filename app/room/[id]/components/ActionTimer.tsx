"use client";

import { useState, useEffect, useRef } from "react";

const TOTAL_SECONDS = 120; // 2 minutes

interface ActionTimerProps {
  /** A key that resets the timer when it changes */
  resetKey: string;
}

export function ActionTimer({ resetKey }: ActionTimerProps) {
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(TOTAL_SECONDS);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetKey]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / TOTAL_SECONDS) * 100;
  const urgent = remaining <= 30;

  return (
    <div className={`action-timer ${urgent ? "urgent" : ""}`}>
      <div className="action-timer-bar">
        <div
          className="action-timer-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="action-timer-text">
        {mins}:{secs.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
