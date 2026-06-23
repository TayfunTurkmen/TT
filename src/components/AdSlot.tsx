"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({
  client,
  slot,
  format = "auto",
  className = "",
}: {
  client?: string | null;
  slot: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
}) {
  useEffect(() => {
    if (!client) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore if ads script has not loaded yet
    }
  }, [client, slot]);

  if (!client) {
    return (
      <div className={className}>
        <span className="ad-label">Advertisement</span>
        <div className="min-h-28 rounded-lg border border-dashed border-[var(--border)] bg-[var(--chip)] p-4 text-center text-xs text-[var(--muted)]">
          Ad placeholder
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <span className="ad-label">Advertisement</span>
      <ins
        className="adsbygoogle block min-h-28 rounded-lg border border-[var(--border)] bg-[var(--chip)]"
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
