"use client";

import { generateStudioDraft, unlockStudio } from "@/app/actions/studio";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function StudioPanel({ enabled }: { enabled: boolean }) {
  const t = useTranslations("autoBlog");
  const locale = useLocale();
  const [secret, setSecret] = useState("");
  const [topic, setTopic] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!enabled) {
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--chip)] p-4 text-sm text-[var(--muted)]">
        {t("unauthorized")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <form
        className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6"
        action={(fd) => {
          setMessage(null);
          start(async () => {
            const res = await unlockStudio(fd);
            if (!res.ok) {
              setMessage(res.error === "auth" ? "Invalid secret." : "Disabled.");
              return;
            }
            setSecret("");
            setMessage("Session unlocked for this browser.");
          });
        }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
          {t("signIn")}
        </h2>
        <label className="mt-4 block text-sm text-[var(--muted)]" htmlFor="secret">
          {t("secretLabel")}
        </label>
        <input
          id="secret"
          name="secret"
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--text)] outline-none ring-0 focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          className="mt-4 rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-[#120b00] disabled:opacity-50"
          disabled={pending}
        >
          {t("signIn")}
        </button>
      </form>

      <form
        className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6"
        action={(fd) => {
          fd.set("locale", locale);
          setMessage(null);
          start(async () => {
            const res = await generateStudioDraft(fd);
            if (!res.ok) {
              const map: Record<string, string> = {
                locked: "Unlock the panel first.",
                topic: "Topic too short.",
                disabled: "Disabled.",
              };
              setMessage(map[res.error] ?? "Error.");
              return;
            }
            setMarkdown(res.markdown ?? "");
            setMessage("Draft ready. Review before publishing.");
          });
        }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
          {t("generate")}
        </h2>
        <label className="mt-4 block text-sm text-[var(--muted)]" htmlFor="topic">
          {t("topic")}
        </label>
        <input
          id="topic"
          name="topic"
          required
          minLength={3}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t("topicPlaceholder")}
          className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#041016] disabled:opacity-50"
          disabled={pending}
        >
          {t("generate")}
        </button>
      </form>

      {message ? (
        <p className="text-sm text-[var(--muted)]" role="status">
          {message}
        </p>
      ) : null}

      {markdown ? (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">{t("result")}</h2>
            <button
              type="button"
              className="rounded-md border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--accent)]"
              onClick={async () => {
                await navigator.clipboard.writeText(markdown);
                setMessage("Copied to clipboard.");
              }}
            >
              {t("copy")}
            </button>
          </div>
          <pre className="max-h-[480px] overflow-auto rounded-xl border border-[var(--border)] bg-black/40 p-4 font-mono text-xs text-[#d8d3e6]">
            {markdown}
          </pre>
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-[var(--muted)]">{t("hint")}</p>
    </div>
  );
}
