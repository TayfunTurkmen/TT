"use client";

import {
  bulkDeleteAdminPostGroups,
  deleteAdminPostGroup,
  deleteContactMessageAdmin,
  generateEditorDraft,
  generateBulkAiDrafts,
  publishAdminPost,
  runCronNow,
  saveMarketingSettings,
  saveAdminPost,
  saveSmtpSettings,
  setupInitialAdmin,
  updateAdminPost,
  unlockAdmin,
} from "@/app/actions/admin";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

type AdminPost = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
  updatedAt: string;
  scheduledFor?: string | null;
};

type CronEntry = {
  id: number;
  source: string;
  ok: boolean;
  publishedCount: number;
  error: string | null;
  createdAt: string;
};

type ContactInboxEntry = {
  id: number;
  name: string;
  email: string;
  body: string;
  locale: string;
  ip: string | null;
  createdAt: string;
};

type EditorBlock = {
  id: string;
  type: "heading" | "paragraph" | "list" | "quote" | "code";
  value: string;
};

function toAutoSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function AdminPanel({
  enabled,
  hasAdminUser,
  unlocked,
  initialPosts,
  initialCronRuns,
  initialSettings,
  initialContactMessages,
  initialSmtp,
}: {
  enabled: boolean;
  hasAdminUser: boolean;
  unlocked: boolean;
  initialPosts: AdminPost[];
  initialCronRuns: CronEntry[];
  initialSettings: {
    adsenseClient: string;
    analyticsMeasurementId: string;
    adSlotBlogList: string;
    adSlotBlogPost: string;
    turnstileSiteKey: string;
    aiApiBaseUrl: string;
    aiModel: string;
    hasAiApiKey: boolean;
  };
  initialContactMessages: ContactInboxEntry[];
  initialSmtp: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpFrom: string;
    contactNotifyEmail: string;
    smtpSecure: boolean;
    hasSmtpPassword: boolean;
  };
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(unlocked);
  const [editorTopic, setEditorTopic] = useState("");
  const [editorSources, setEditorSources] = useState("");
  const [editorTitle, setEditorTitle] = useState("");
  const [editorExcerpt, setEditorExcerpt] = useState("");
  const [editorTags, setEditorTags] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorPublished, setEditorPublished] = useState(false);
  const [editorScheduleDate, setEditorScheduleDate] = useState("");
  const [editingTarget, setEditingTarget] = useState<{ locale: string; slug: string } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "editor" | "posts" | "automation" | "contact" | "settings"
  >("editor");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const slugPreview = useMemo(
    () => (editingTarget ? editingTarget.slug : toAutoSlug(editorTitle) || "post"),
    [editingTarget, editorTitle],
  );
  const groupedPosts = Object.values(
    initialPosts.reduce<Record<string, { slug: string; locales: AdminPost[] }>>((acc, post) => {
      if (!acc[post.slug]) acc[post.slug] = { slug: post.slug, locales: [] };
      acc[post.slug].locales.push(post);
      return acc;
    }, {}),
  );
  const toggleSlugSelection = (slug: string) =>
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug],
    );

  const addBlock = (type: EditorBlock["type"]) =>
    setBlocks((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, value: "" }]);

  const moveBlock = (index: number, direction: -1 | 1) =>
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });

  const updateBlock = (id: string, value: string) =>
    setBlocks((prev) => prev.map((x) => (x.id === id ? { ...x, value } : x)));

  const removeBlock = (id: string) => setBlocks((prev) => prev.filter((x) => x.id !== id));

  const applyBlocksToMarkdown = () => {
    const markdown = blocks
      .map((b) => {
        const text = b.value.trim();
        if (!text) return "";
        if (b.type === "heading") return `## ${text}`;
        if (b.type === "paragraph") return text;
        if (b.type === "list") {
          return text
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => `- ${line}`)
            .join("\n");
        }
        if (b.type === "quote") return `> ${text}`;
        return `\`\`\`txt\n${text}\n\`\`\``;
      })
      .filter(Boolean)
      .join("\n\n");
    setEditorContent(markdown);
  };

  const resetEditor = () => {
    setEditingTarget(null);
    setEditorTitle("");
    setEditorExcerpt("");
    setEditorTags("");
    setEditorContent("");
    setEditorPublished(false);
    setEditorScheduleDate("");
    setBlocks([]);
  };

  const loadPostToEditor = (post: AdminPost) => {
    setEditingTarget({ locale: post.locale, slug: post.slug });
    setEditorTitle(post.title);
    setEditorExcerpt(post.excerpt ?? "");
    setEditorTags(post.tags.join(", "));
    setEditorContent(post.content);
    setEditorPublished(post.published);
    setEditorScheduleDate(post.scheduledFor ? post.scheduledFor.slice(0, 10) : "");
    setActiveTab("editor");
  };

  if (!enabled) {
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--chip)] p-4 text-sm text-[var(--muted)]">
        {t("locked")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {initialSettings.turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      ) : null}
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
          {initialSettings.turnstileSiteKey ? (
            <div
              className="cf-turnstile mt-3"
              data-sitekey={initialSettings.turnstileSiteKey}
            />
          ) : null}
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
          {initialSettings.turnstileSiteKey ? (
            <div
              className="cf-turnstile mt-3"
              data-sitekey={initialSettings.turnstileSiteKey}
            />
          ) : null}
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
          <div className="min-w-0 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-0 flex-nowrap gap-2 sm:w-full sm:flex-wrap">
              {[
                ["editor", t("tabEditor")],
                ["posts", t("tabPosts")],
                ["automation", t("tabAutomation")],
                ["contact", t("tabContact")],
                ["settings", t("tabSettings")],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setActiveTab(id as "editor" | "posts" | "automation" | "contact" | "settings")
                  }
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
                    activeTab === id
                      ? "bg-[var(--accent-2)] text-white"
                      : "bg-[var(--bg)] text-[var(--text)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <form
            className={`rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6 ${
              activeTab === "settings" ? "" : "hidden"
            }`}
            action={(fd) => {
              setMessage(null);
              start(async () => {
                const res = await saveMarketingSettings(fd);
                setMessage(res.ok ? t("settingsSaved") : t("error"));
              });
            }}
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
              {t("marketingTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("marketingLead")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-[var(--muted)]">
                {t("adsenseClient")}
                <input
                  name="adsenseClient"
                  defaultValue={initialSettings.adsenseClient}
                  placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("analyticsId")}
                <input
                  name="analyticsMeasurementId"
                  defaultValue={initialSettings.analyticsMeasurementId}
                  placeholder="G-XXXXXXXXXX"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("adSlotBlogList")}
                <input
                  name="adSlotBlogList"
                  defaultValue={initialSettings.adSlotBlogList}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("adSlotBlogPost")}
                <input
                  name="adSlotBlogPost"
                  defaultValue={initialSettings.adSlotBlogPost}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("turnstileSiteKey")}
                <input
                  name="turnstileSiteKey"
                  defaultValue={initialSettings.turnstileSiteKey}
                  placeholder="0x4AAAA..."
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("turnstileSecretKey")}
                <input
                  name="turnstileSecretKey"
                  type="password"
                  placeholder="Update secret key"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("customAiApiBaseUrl")}
                <input
                  name="aiApiBaseUrl"
                  defaultValue={initialSettings.aiApiBaseUrl}
                  placeholder="https://api.openai.com/v1"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("customAiModel")}
                <input
                  name="aiModel"
                  defaultValue={initialSettings.aiModel}
                  placeholder="gpt-4o-mini"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <label className="text-sm text-[var(--muted)] sm:col-span-2">
                {t("customAiApiKey")}
                <input
                  name="aiApiKey"
                  type="password"
                  placeholder={
                    initialSettings.hasAiApiKey
                      ? t("customAiApiKeyHintSet")
                      : t("customAiApiKeyHintEmpty")
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="mt-4 rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t("saveSettings")}
            </button>
          </form>

          <section
            className={`rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6 ${
              activeTab === "automation" ? "" : "hidden"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
                  {t("cronTitle")}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{t("cronLead")}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setMessage(null);
                  start(async () => {
                    const res = await runCronNow();
                    setMessage(res.ok ? t("cronRunOk") : t("error"));
                    if (res.ok) router.refresh();
                  });
                }}
                className="rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t("cronRunNow")}
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {initialCronRuns.length === 0 ? (
                <li>{t("cronEmpty")}</li>
              ) : (
                initialCronRuns.map((run) => (
                  <li key={run.id} className="rounded-lg border border-[var(--border)] p-3">
                    <p className="font-mono text-xs text-[var(--muted)]">{run.createdAt}</p>
                    <p className="mt-1">
                      {run.ok ? "ok" : "fail"} · {run.source} · published: {run.publishedCount}
                    </p>
                    {run.error ? <p className="mt-1 text-xs text-[#ff9a9a]">{run.error}</p> : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <div
            className={`space-y-6 ${activeTab === "contact" ? "" : "hidden"}`}
          >
            <form
              className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-4 sm:p-6"
              action={(fd) => {
                setMessage(null);
                start(async () => {
                  const res = await saveSmtpSettings(fd);
                  setMessage(res.ok ? t("settingsSaved") : t("error"));
                  if (res.ok) router.refresh();
                });
              }}
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
                {t("smtpTitle")}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{t("smtpLead")}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="min-w-0 text-sm text-[var(--muted)] sm:col-span-2">
                  {t("smtpNotifyEmail")}
                  <input
                    name="contactNotifyEmail"
                    type="email"
                    defaultValue={initialSmtp.contactNotifyEmail}
                    placeholder="you@example.com"
                    className="mt-1 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  {t("smtpHost")}
                  <input
                    name="smtpHost"
                    defaultValue={initialSmtp.smtpHost}
                    placeholder="smtp.example.com"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  {t("smtpPort")}
                  <input
                    name="smtpPort"
                    defaultValue={initialSmtp.smtpPort}
                    placeholder="587"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  {t("smtpUser")}
                  <input
                    name="smtpUser"
                    defaultValue={initialSmtp.smtpUser}
                    autoComplete="off"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  {t("smtpPass")}
                  <input
                    name="smtpPass"
                    type="password"
                    placeholder={
                      initialSmtp.hasSmtpPassword ? t("smtpPassHintSet") : t("smtpPassHintEmpty")
                    }
                    autoComplete="new-password"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="text-sm text-[var(--muted)] sm:col-span-2">
                  {t("smtpFrom")}
                  <input
                    name="smtpFrom"
                    defaultValue={initialSmtp.smtpFrom}
                    placeholder="noreply@example.com"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)] sm:col-span-2">
                  <input
                    type="checkbox"
                    name="smtpSecure"
                    value="on"
                    defaultChecked={initialSmtp.smtpSecure}
                    className="rounded border-[var(--border)]"
                  />
                  {t("smtpSecure")}
                </label>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="mt-4 rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t("saveSmtp")}
              </button>
            </form>

            <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-4 sm:p-6">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
                {t("contactInboxTitle")}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{t("contactInboxLead")}</p>
              {initialContactMessages.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted)]">{t("contactInboxEmpty")}</p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm">
                  {initialContactMessages.map((m) => (
                    <li
                      key={m.id}
                      className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-medium text-[var(--text)]">
                            {m.name} ·{" "}
                            <a
                              className="break-all text-[var(--accent)]"
                              href={`mailto:${m.email}`}
                            >
                              {m.email}
                            </a>
                          </p>
                          <p className="break-words text-xs text-[var(--muted)]">
                            {m.createdAt} · {m.locale.toUpperCase()}
                            {m.ip ? ` · ${m.ip}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (!window.confirm(t("contactDeleteConfirm"))) return;
                            setMessage(null);
                            start(async () => {
                              const res = await deleteContactMessageAdmin(m.id);
                              setMessage(res.ok ? t("deleted") : t("error"));
                              if (res.ok) router.refresh();
                            });
                          }}
                          className="shrink-0 rounded-lg border border-[#ff8a8a] bg-[#2b1111] px-2 py-1 text-xs font-semibold text-[#ffb4b4] disabled:opacity-50"
                        >
                          {t("delete")}
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-[var(--muted)]">
                        {m.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section
            className={`rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6 ${
              activeTab === "editor" ? "" : "hidden"
            }`}
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
              {t("builderTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("builderLead")}</p>
            <button
              type="button"
              onClick={resetEditor}
              className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)]"
            >
              {t("newManualDraft")}
            </button>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={editorTopic}
                onChange={(e) => setEditorTopic(e.target.value)}
                placeholder={t("builderTopic")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <textarea
                value={editorSources}
                onChange={(e) => setEditorSources(e.target.value)}
                rows={3}
                placeholder={t("builderSources")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending || !editorTopic.trim()}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("locale", locale);
                  fd.set("topic", editorTopic.trim());
                  fd.set("sourceUrls", editorSources);
                  setMessage(null);
                  start(async () => {
                    const res = await generateEditorDraft(fd);
                    if (!res.ok) {
                      setMessage(t("error"));
                      return;
                    }
                    setEditorTitle(res.title);
                    setEditorExcerpt(res.excerpt);
                    setEditorTags(res.tags);
                    setEditorContent(res.content);
                    setMessage(t("builderFilled"));
                  });
                }}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-semibold text-[var(--text)] disabled:opacity-50"
              >
                {t("builderAiFill")}
              </button>
              <button type="button" onClick={() => addBlock("heading")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+H</button>
              <button type="button" onClick={() => addBlock("paragraph")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+P</button>
              <button type="button" onClick={() => addBlock("list")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+List</button>
              <button type="button" onClick={() => addBlock("quote")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+Quote</button>
              <button type="button" onClick={() => addBlock("code")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+Code</button>
              <button
                type="button"
                onClick={applyBlocksToMarkdown}
                className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#041016]"
              >
                {t("builderApply")}
              </button>
            </div>
            {blocks.length > 0 ? (
              <div className="mt-4 space-y-3">
                {blocks.map((block, index) => (
                  <div key={block.id} className="rounded-lg border border-[var(--border)] p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>{block.type}</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => moveBlock(index, -1)}>↑</button>
                        <button type="button" onClick={() => moveBlock(index, 1)}>↓</button>
                        <button type="button" onClick={() => removeBlock(block.id)}>✕</button>
                      </div>
                    </div>
                    <textarea
                      value={block.value}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      rows={block.type === "paragraph" ? 4 : 2}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <form
            className={`rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6 ${
              activeTab === "editor" ? "" : "hidden"
            }`}
            action={(fd) => {
              fd.set("locale", locale);
              if (editingTarget) {
                fd.set("originalLocale", editingTarget.locale);
                fd.set("originalSlug", editingTarget.slug);
              }
              setMessage(null);
              start(async () => {
                const res = editingTarget ? await updateAdminPost(fd) : await saveAdminPost(fd);
                setMessage(res.ok ? t("saved") : t("error"));
                if (res.ok) {
                  router.refresh();
                  if (!editingTarget) resetEditor();
                }
              });
            }}
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
              {t("title")}
            </h2>
            <div className="mt-4 grid gap-3">
              <input
                name="title"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder={t("titleField")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                required
              />
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--muted)]">
                {t("slugAuto")}: <span className="text-[var(--text)]">{slugPreview}</span>
              </div>
              <input
                name="excerpt"
                value={editorExcerpt}
                onChange={(e) => setEditorExcerpt(e.target.value)}
                placeholder={t("excerpt")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <input
                name="tags"
                value={editorTags}
                onChange={(e) => setEditorTags(e.target.value)}
                placeholder={t("tags")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <textarea
                name="content"
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder={t("content")}
                rows={12}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                required
              />
              <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  name="published"
                  checked={editorPublished}
                  onChange={(e) => setEditorPublished(e.target.checked)}
                />
                {t("published")}
              </label>
              <label className="text-sm text-[var(--muted)]">
                {t("scheduleDate")}
                <input
                  type="date"
                  name="scheduleDate"
                  value={editorScheduleDate}
                  onChange={(e) => setEditorScheduleDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#041016] disabled:opacity-50"
              >
                {editingTarget ? t("updatePost") : t("save")}
              </button>
              {editingTarget ? (
                <button
                  type="button"
                  onClick={resetEditor}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
                >
                  {t("cancelEdit")}
                </button>
              ) : null}
            </div>
          </form>

          <form
            className={`rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6 ${
              activeTab === "automation" ? "" : "hidden"
            }`}
            action={(fd) => {
              fd.set("locale", locale);
              setMessage(null);
              start(async () => {
                const res = await generateBulkAiDrafts(fd);
                setMessage(res.ok ? t("bulkSaved") : t("error"));
                if (res.ok) router.refresh();
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
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-[var(--text)]">
              <input type="checkbox" name="useWebResearch" className="mt-1" />
              <span>{t("bulkUseWeb")}</span>
            </label>
            <label className="mt-3 block text-sm text-[var(--muted)]">
              {t("bulkWebSources")}
              <textarea
                name="webSourceUrls"
                rows={4}
                placeholder="https://example.com/article"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
            </label>
            <p className="mt-2 text-xs text-[var(--muted)]">{t("bulkWebSourcesLead")}</p>
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
            <button
              type="submit"
              name="runNow"
              value="1"
              disabled={pending}
              className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm font-semibold text-[var(--text)] disabled:opacity-50"
            >
              {t("bulkRunNow")}
            </button>
          </form>

          <section
            className={`rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6 ${
              activeTab === "posts" ? "" : "hidden"
            }`}
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
              {t("listTitle")}
            </h2>
            {initialPosts.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">{t("empty")}</p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSlugs(groupedPosts.map((g) => g.slug))}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
                  >
                    {t("selectAll")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlugs([])}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
                  >
                    {t("clearSelection")}
                  </button>
                  <button
                    type="button"
                    disabled={pending || selectedSlugs.length === 0}
                    onClick={() => {
                      if (!window.confirm(t("deleteConfirm"))) return;
                      setMessage(null);
                      start(async () => {
                        const res = await bulkDeleteAdminPostGroups(selectedSlugs);
                        setMessage(res.ok ? t("bulkDeleted") : t("error"));
                        if (res.ok) {
                          setSelectedSlugs([]);
                          router.refresh();
                        }
                      });
                    }}
                    className="rounded-lg border border-[#ff8a8a] bg-[#2b1111] px-3 py-1.5 text-xs font-semibold text-[#ffb4b4] disabled:opacity-50"
                  >
                    {t("deleteSelected")}
                  </button>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {groupedPosts.map((group) => {
                  const primary =
                    group.locales.find((p) => p.locale === locale) ??
                    group.locales.find((p) => p.locale === "en") ??
                    group.locales[0];
                  const isPublished = group.locales.some((p) => p.published);
                  const scheduled = group.locales.find((p) => p.scheduledFor)?.scheduledFor ?? null;
                  return (
                    <li
                      key={group.slug}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3"
                    >
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={selectedSlugs.includes(group.slug)}
                          onChange={() => toggleSlugSelection(group.slug)}
                        />
                        <span>{t("select")}</span>
                      </label>
                      <div>
                        <p className="font-medium text-[var(--text)]">{primary.title}</p>
                        <p className="text-xs text-[var(--muted)]">
                          ({group.slug}) · {group.locales.map((p) => p.locale.toUpperCase()).join("/")}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm">
                        {isPublished ? "published" : scheduled ? `scheduled: ${scheduled.slice(0, 10)}` : "draft"}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
                        onClick={() => loadPostToEditor(primary)}
                      >
                        {t("editPost")}
                      </button>
                      {!isPublished ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            setMessage(null);
                            start(async () => {
                              const res = await publishAdminPost(primary.locale, primary.slug);
                              setMessage(res.ok ? t("publishedNow") : t("error"));
                              if (res.ok) router.refresh();
                            });
                          }}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] disabled:opacity-50"
                        >
                          {t("publishNow")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(t("deleteConfirm"))) return;
                          setMessage(null);
                          start(async () => {
                            const res = await deleteAdminPostGroup(group.slug);
                            setMessage(res.ok ? t("deleted") : t("error"));
                            if (res.ok) router.refresh();
                          });
                        }}
                        className="rounded-lg border border-[#ff8a8a] bg-[#2b1111] px-3 py-1.5 text-xs font-semibold text-[#ffb4b4] disabled:opacity-50"
                      >
                        {t("delete")}
                      </button>
                    </li>
                  );
                })}
                </ul>
              </>
            )}
          </section>
        </>
      )}

      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
