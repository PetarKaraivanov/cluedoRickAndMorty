"use client";

import { useState, useEffect, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = false,
  forceOpen,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Auto-expand when forceOpen becomes true
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <section className={`collapsible-section ${open ? "open" : "closed"} ${className}`}>
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="collapsible-title">
          {icon && <span className="collapsible-icon">{icon}</span>}
          {title}
        </span>
        <span className="collapsible-right">
          {badge}
          <span className="collapsible-chevron">{open ? "▼" : "▶"}</span>
        </span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}
