"use client";

import {
  generateBulkAiDrafts,
  saveAdminPost,
  setupInitialAdmin,
  unlockAdmin,
} from "@/app/actions/admin";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

type AdminPost = {
  slug: string;
  locale: string;
  title: string;
  published: boolean;
  updatedAt: string;
  scheduledFor?: string | null;
};

export function AdminPanel({
  enabled,
  hasAdminUser,
  unlocked,
  initialPosts,
}: {
  enabled: boolean;
  hasAdminUser: boolean;
  unlocked: boolean;
  initialPosts: AdminPost[];
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(unlocked);

  if (!enabled) {
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--chip)] p-4 text-sm text-[var(--muted)]">
        {t("locked")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {!hasAdminUser && !isUnlocked ? (
        <form
          className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6"
          action={(fd) => {
            setMessage(null);
            start(async () => {
              const res = await setupInitialAdmin(fd);
              if (!res.ok) {
                const err = res.error === "invalid" ? t("setupInvalid") : t("error");
                setMessage(err);
                return;
              }
              setMessage(t("registered"));
              setIsUnlocked(true);
            });
          }}
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
            {t("setupTitle")}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("setupLead")}</p>
          <input
            name="username"
            type="text"
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            placeholder={t("username")}
          />
          <input
            name="password"
            type="password"
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            placeholder={t("password")}
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-3 rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("setupCta")}
          </button>
        </form>
      ) : null}

      {!isUnlocked ? (
        <form
          className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6"
          action={(fd) => {
            setMessage(null);
            start(async () => {
              const res = await unlockAdmin(fd);
              if (!res.ok) {
                const err =
                  res.error === "auth"
                    ? t("loginFailed")
                    : res.error === "invalid"
                      ? t("setupInvalid")
                      : t("error");
                setMessage(err);
                return;
              }
              setMessage(t("unlock"));
              setIsUnlocked(true);
            });
          }}
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
            {t("unlock")}
          </h2>
          <input
            name="username"
            type="text"
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            placeholder={t("username")}
          />
          <input
            name="password"
            type="password"
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            placeholder={t("password")}
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-3 rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("unlock")}
          </button>
        </form>
      ) : (
        <>
          <form
            className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6"
            action={(fd) => {
              fd.set("locale", locale);
              setMessage(null);
              start(async () => {
                const res = await saveAdminPost(fd);
                setMessage(res.ok ? t("saved") : t("error"));
              });
            }}
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
              {t("title")}
            </h2>
            <div className="mt-4 grid gap-3">
              <input
                name="title"
                placeholder={t("titleField")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                required
              />
              <input
                name="slug"
                placeholder={t("slug")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <input
                name="excerpt"
                placeholder={t("excerpt")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <input
                name="tags"
                placeholder={t("tags")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <textarea
                name="content"
                placeholder={t("content")}
                rows={12}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                required
              />
              <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                <input type="checkbox" name="published" />
                {t("published")}
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("scheduleDate")}
                <input
                  type="date"
                  name="scheduleDate"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#041016] disabled:opacity-50"
            >
              {t("save")}
            </button>
          </form>

          <form
            className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6"
            action={(fd) => {
              fd.set("locale", locale);
              setMessage(null);
              start(async () => {
                const res = await generateBulkAiDrafts(fd);
                setMessage(res.ok ? t("bulkSaved") : t("error"));
              });
            }}
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
              {t("bulkTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("bulkLead")}</p>
            <textarea
              name="topics"
              rows={8}
              className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              placeholder={t("topics")}
              required
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-[var(--muted)]">
                {t("startDate")}
                <input
                  type="date"
                  name="startDate"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("intervalDays")}
                <input
                  type="number"
                  min={1}
                  name="intervalDays"
                  defaultValue={1}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="mt-4 rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t("bulkGenerate")}
            </button>
          </form>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
              {t("listTitle")}
            </h2>
            {initialPosts.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">{t("empty")}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {initialPosts.map((post) => (
                  <li key={`${post.locale}-${post.slug}`} className="flex justify-between gap-4">
                    <span>
                      [{post.locale}] {post.title} ({post.slug})
                    </span>
                    <span>
                      {post.published
                        ? "published"
                        : post.scheduledFor
                          ? `scheduled: ${post.scheduledFor.slice(0, 10)}`
                          : "draft"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
