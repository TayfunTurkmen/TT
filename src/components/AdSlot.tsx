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
      <div
        className={`rounded-xl border border-dashed border-[var(--border)] bg-[var(--chip)] p-4 text-center text-xs text-[var(--muted)] ${className}`}
      >
        Ad placeholder
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block rounded-xl border border-[var(--border)] bg-[var(--chip)] ${className}`}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
