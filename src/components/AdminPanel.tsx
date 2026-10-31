"use client";

import {
  bulkDeleteAdminPostGroups,
  checkTwoFactorCode,
  createTwoFactorSecret,
  deleteAdminPostGroup,
  deleteContactMessageAdmin,
  deleteConsultingBookingAdmin,
  generateEditorDraft,
  generateBulkAiDrafts,
  logoutAdmin,
  publishAdminPost,
  runCronNow,
  saveMarketingSettings,
  saveConsultingSettings,
  saveAdminPost,
  saveSmtpSettings,
  syncSitePostsToAdmin,
  updateAdminPost,
} from "@/app/actions/admin";
import { AdminLogin } from "@/components/AdminLogin";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";

type AdminPost = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
  updatedAt: string;
  featuredImage?: string | null;
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

type ConsultingBookingEntry = {
  id: number;
  name: string;
  email: string;
  package: "30" | "60";
  preferredDate: string;
  preferredTime: string;
  topic: string;
  locale: string;
  status: "pending" | "paid" | "cancelled";
  amountCents: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
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

type AdminTab = "editor" | "posts" | "automation" | "contact" | "consulting" | "settings" | "security";

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        ok
          ? "border-[var(--border)] text-[var(--text)]"
          : "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`} aria-hidden />
      {label}
    </span>
  );
}

export function AdminPanel({
  auth,
  session,
  d1Connected,
  initialPosts,
  initialCronRuns,
  initialSettings,
  initialContactMessages,
  initialConsulting,
  initialConsultingBookings,
  initialSmtp,
}: {
  auth: { configured: boolean; problems: string[]; twoFactorEnabled: boolean };
  session: { username: string; expiresAt: number } | null;
  d1Connected: boolean;
  initialPosts: AdminPost[];
  initialCronRuns: CronEntry[];
  initialSettings: {
    analyticsMeasurementId: string;
    aiApiBaseUrl: string;
    aiModel: string;
    hasAiApiKey: boolean;
  };
  initialContactMessages: ContactInboxEntry[];
  initialConsulting: {
    consultingPrice30: number;
    consultingPrice60: number;
    consultingCurrency: string;
    consultingEnabled: boolean;
    hasStripeSecretKey: boolean;
    hasStripeWebhookSecret: boolean;
  };
  initialConsultingBookings: ConsultingBookingEntry[];
  initialSmtp: {
    hasBrevoApiKey: boolean;
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
  const [editorTopic, setEditorTopic] = useState("");
  const [editorSources, setEditorSources] = useState("");
  const [editorTitle, setEditorTitle] = useState("");
  const [editorExcerpt, setEditorExcerpt] = useState("");
  const [editorTags, setEditorTags] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorPublished, setEditorPublished] = useState(false);
  const [editorScheduleDate, setEditorScheduleDate] = useState("");
  const [editingTarget, setEditingTarget] = useState<{ locale: string; slug: string } | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>(d1Connected ? "editor" : "security");
  const [twoFactorDraft, setTwoFactorDraft] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [twoFactorTestCode, setTwoFactorTestCode] = useState("");
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
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);
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

  const uploadMediaToR2 = async (file: File) => {
    const fd = new FormData();
    fd.set("file", file);
    const response = await fetch("/api/r2/upload", {
      method: "POST",
      body: fd,
    });
    const payload = (await response.json()) as
      | { ok: true; url: string }
      | { ok: false; error: string };
    if (!response.ok || !payload.ok) {
      throw new Error("upload failed");
    }
    const markdown = `![${file.name.replace(/\.[^.]+$/, "")}](${payload.url})`;
    setEditorContent((prev) => (prev.trim() ? `${prev.trim()}\n\n${markdown}` : markdown));
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

  if (!session) {
    return (
      <AdminLogin
        configured={auth.configured}
        problems={auth.problems}
        twoFactorEnabled={auth.twoFactorEnabled}
      />
    );
  }

  const tabs: Array<[AdminTab, string]> = [
    ["editor", t("tabEditor")],
    ["posts", t("tabPosts")],
    ["automation", t("tabAutomation")],
    ["contact", t("tabContact")],
    ["consulting", t("tabConsulting")],
    ["settings", t("tabSettings")],
    ["security", t("tabSecurity")],
  ];
  const securityChecks: Array<[string, boolean]> = [
    [t("checkCredentials"), true],
    [t("checkSession"), true],
    [t("checkRateLimit"), true],
    [t("checkTwoFactor"), auth.twoFactorEnabled],
    [t("checkD1"), d1Connected],
  ];
  const sessionEnds = new Date(session.expiresAt).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            {t("signedInAs", { username: session.username })} ·{" "}
            <time suppressHydrationWarning>{t("sessionEnds", { time: sessionEnds })}</time>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill ok={d1Connected} label={d1Connected ? t("d1Connected") : t("d1Disconnected")} />
          <StatusPill ok={auth.twoFactorEnabled} label={auth.twoFactorEnabled ? t("twoFactorOn") : t("twoFactorOff")} />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              start(async () => {
                await logoutAdmin();
                router.refresh();
              });
            }}
            className="btn-secondary min-h-8 px-3 py-1.5 text-xs"
          >
            {t("logout")}
          </button>
        </div>
      </header>

      {!d1Connected ? (
        <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-4 text-sm">
          <p className="font-medium text-[var(--text)]">{t("d1MissingTitle")}</p>
          <p className="mt-1 leading-relaxed text-[var(--muted)]">{t("d1MissingLead")}</p>
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [t("publishedPosts"), initialPosts.filter((post) => post.published).length],
          [t("drafts"), initialPosts.filter((post) => !post.published && !post.scheduledFor).length],
          [t("scheduled"), initialPosts.filter((post) => !post.published && post.scheduledFor).length],
          [t("messages"), initialContactMessages.length],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--text)]">
              {d1Connected ? value : "–"}
            </p>
          </article>
        ))}
      </section>

      <div
        role="tablist"
        aria-label={t("title")}
        className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-[var(--bg)] text-[var(--text)] shadow-[var(--shadow-sm)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "security" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">{t("securityTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("securityLead")}</p>
          <ul className="mt-5 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
            {securityChecks.map(([label, ok]) => (
              <li key={label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-[var(--text)]">
                <span>{label}</span>
                <StatusPill ok={ok} label={ok ? t("statusOn") : t("statusOff")} />
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-[var(--border)] p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-[var(--text)]">{t("twoFactorTitle")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              {auth.twoFactorEnabled ? `${t("twoFactorEnabled")} ${t("twoFactorDisableHint")}` : t("twoFactorDisabled")}
            </p>
            {!auth.twoFactorEnabled && !twoFactorDraft ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  start(async () => {
                    const res = await createTwoFactorSecret();
                    if (res.ok) setTwoFactorDraft({ secret: res.secret, otpauthUri: res.otpauthUri });
                    else setMessage(t("error"));
                  });
                }}
                className="btn-secondary mt-4 min-h-9 px-3.5 py-1.5 text-sm"
              >
                {t("twoFactorGenerate")}
              </button>
            ) : null}
            {!auth.twoFactorEnabled && twoFactorDraft ? (
              <div className="mt-4 space-y-4">
                <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
                  <li>{t("twoFactorStep1")}</li>
                  <li>{t("twoFactorStep2")}</li>
                  <li>{t("twoFactorStep3")}</li>
                </ol>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--text)]">
                    ADMIN_TOTP_SECRET={twoFactorDraft.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(`ADMIN_TOTP_SECRET=${twoFactorDraft.secret}`)
                        .then(() => setMessage(t("copied")));
                    }}
                    className="btn-secondary min-h-8 px-3 py-1.5 text-xs"
                  >
                    {t("copy")}
                  </button>
                  <a href={twoFactorDraft.otpauthUri} className="btn-secondary min-h-8 px-3 py-1.5 text-xs">
                    {t("twoFactorOpen")}
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={twoFactorTestCode}
                    onChange={(event) => setTwoFactorTestCode(event.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder={t("twoFactorCode")}
                    aria-label={t("twoFactorCode")}
                    className="w-40 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm tracking-[0.2em] text-[var(--text)]"
                  />
                  <button
                    type="button"
                    disabled={pending || twoFactorTestCode.length !== 6}
                    onClick={() => {
                      start(async () => {
                        const res = await checkTwoFactorCode(twoFactorDraft.secret, twoFactorTestCode);
                        setMessage(res.ok ? t("twoFactorTestOk") : t("twoFactorInvalid"));
                      });
                    }}
                    className="btn-primary min-h-9 px-3.5 py-1.5"
                  >
                    {t("twoFactorTest")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">{t("signOutAllHint")}</p>
        </section>
      ) : null}

      {d1Connected ? (
        <>
          <form
            className={`rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6 ${
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
                {t("analyticsId")}
                <input
                  name="analyticsMeasurementId"
                  defaultValue={initialSettings.analyticsMeasurementId}
                  placeholder="G-XXXXXXXXXX"
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
              className="mt-4 btn-primary"
            >
              {t("saveSettings")}
            </button>
          </form>

          <section
            className={`rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6 ${
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
              <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setMessage(null);
                  start(async () => {
                    const res = await syncSitePostsToAdmin();
                    setMessage(res.ok ? t("sitePostsSynced") : t("error"));
                    if (res.ok) router.refresh();
                  });
                }}
                className="btn-secondary"
              >
                {t("syncSitePosts")}
              </button>
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
                className="btn-primary"
              >
                {t("cronRunNow")}
              </button>
              </div>
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
                    {run.error ? <p className="mt-1 text-xs text-[var(--danger)]">{run.error}</p> : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <div
            className={`space-y-6 ${activeTab === "contact" ? "" : "hidden"}`}
          >
            <form
              className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-6"
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
                <label className="min-w-0 text-sm text-[var(--muted)] sm:col-span-2">
                  {t("brevoApiKey")}
                  <input
                    name="brevoApiKey"
                    type="password"
                    placeholder={
                      initialSmtp.hasBrevoApiKey ? t("brevoApiKeyHintSet") : t("brevoApiKeyHintEmpty")
                    }
                    autoComplete="new-password"
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
                className="mt-4 btn-primary"
              >
                {t("saveSmtp")}
              </button>
            </form>

            <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-6">
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
                              className="break-all text-[var(--accent-ink)]"
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
                          className="shrink-0 btn-danger"
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

          <div className={`space-y-6 ${activeTab === "consulting" ? "" : "hidden"}`}>
            <form
              className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-6"
              action={(fd) => {
                setMessage(null);
                start(async () => {
                  const res = await saveConsultingSettings(fd);
                  setMessage(res.ok ? t("settingsSaved") : t("error"));
                  if (res.ok) router.refresh();
                });
              }}
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
                {t("consultingTitle")}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{t("consultingLead")}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-[var(--muted)] sm:col-span-2">
                  <input
                    name="consultingEnabled"
                    type="checkbox"
                    value="on"
                    defaultChecked={initialConsulting.consultingEnabled}
                    className="rounded border-[var(--border)]"
                  />
                  {t("consultingEnabled")}
                </label>
                <label className="text-sm text-[var(--muted)]">
                  {t("consultingPrice30")}
                  <input
                    name="consultingPrice30"
                    type="number"
                    min={100}
                    step={100}
                    required
                    defaultValue={initialConsulting.consultingPrice30}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  {t("consultingPrice60")}
                  <input
                    name="consultingPrice60"
                    type="number"
                    min={100}
                    step={100}
                    required
                    defaultValue={initialConsulting.consultingPrice60}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  {t("consultingCurrency")}
                  <input
                    name="consultingCurrency"
                    defaultValue={initialConsulting.consultingCurrency}
                    placeholder="usd"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="text-sm text-[var(--muted)] sm:col-span-2">
                  {t("stripeSecretKey")}
                  <input
                    name="stripeSecretKey"
                    type="password"
                    placeholder={
                      initialConsulting.hasStripeSecretKey
                        ? t("stripeSecretKeyHintSet")
                        : t("stripeSecretKeyHintEmpty")
                    }
                    autoComplete="new-password"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
                <label className="text-sm text-[var(--muted)] sm:col-span-2">
                  {t("stripeWebhookSecret")}
                  <input
                    name="stripeWebhookSecret"
                    type="password"
                    placeholder={
                      initialConsulting.hasStripeWebhookSecret
                        ? t("stripeWebhookSecretHintSet")
                        : t("stripeWebhookSecretHintEmpty")
                    }
                    autoComplete="new-password"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </label>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{t("consultingWebhookHint")}</p>
              <button
                type="submit"
                disabled={pending}
                className="mt-4 btn-primary"
              >
                {t("saveConsulting")}
              </button>
            </form>

            <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-6">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
                {t("consultingBookingsTitle")}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{t("consultingBookingsLead")}</p>
              {initialConsultingBookings.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted)]">{t("consultingBookingsEmpty")}</p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm">
                  {initialConsultingBookings.map((b) => (
                    <li
                      key={b.id}
                      className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-medium text-[var(--text)]">
                            {b.name} ·{" "}
                            <a className="break-all text-[var(--accent-ink)]" href={`mailto:${b.email}`}>
                              {b.email}
                            </a>
                          </p>
                          <p className="break-words text-xs text-[var(--muted)]">
                            {b.createdAt}
                            {b.paidAt ? ` · paid ${b.paidAt}` : ""} · {b.locale.toUpperCase()} ·{" "}
                            {b.package} min · {(b.amountCents / 100).toFixed(2)} {b.currency.toUpperCase()}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {b.preferredDate} {b.preferredTime} ·{" "}
                            <span
                              className={
                                b.status === "paid"
                                  ? "text-[var(--accent-2)]"
                                  : b.status === "pending"
                                    ? "text-[var(--muted)]"
                                    : "text-[var(--danger)]"
                              }
                            >
                              {b.status}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (!window.confirm(t("consultingDeleteConfirm"))) return;
                            setMessage(null);
                            start(async () => {
                              const res = await deleteConsultingBookingAdmin(b.id);
                              setMessage(res.ok ? t("deleted") : t("error"));
                              if (res.ok) router.refresh();
                            });
                          }}
                          className="shrink-0 btn-danger"
                        >
                          {t("delete")}
                        </button>
                      </div>
                      {b.topic ? (
                        <p className="mt-2 whitespace-pre-wrap break-words text-[var(--muted)]">
                          {b.topic}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section
            className={`rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6 ${
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
              <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-semibold text-[var(--text)]">
                {t("mediaUpload")}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={pending}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (!file) return;
                    setMessage(null);
                    start(async () => {
                      try {
                        await uploadMediaToR2(file);
                        setMessage(t("mediaUploaded"));
                      } catch {
                        setMessage(t("mediaUploadError"));
                      }
                    });
                  }}
                />
              </label>
              <button type="button" onClick={() => addBlock("heading")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+H</button>
              <button type="button" onClick={() => addBlock("paragraph")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+P</button>
              <button type="button" onClick={() => addBlock("list")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+List</button>
              <button type="button" onClick={() => addBlock("quote")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+Quote</button>
              <button type="button" onClick={() => addBlock("code")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">+Code</button>
              <button
                type="button"
                onClick={applyBlocksToMarkdown}
                className="btn-primary min-h-8 px-3 py-1.5 text-xs"
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
            className={`rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6 ${
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
              {editingTarget ? t("editPost") : t("newPost")}
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
                className="btn-primary"
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
            className={`rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6 ${
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
              className="mt-4 btn-primary"
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
            className={`rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6 ${
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
                    className="btn-secondary min-h-8 px-3 py-1.5 text-xs"
                  >
                    {t("selectAll")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlugs([])}
                    className="btn-secondary min-h-8 px-3 py-1.5 text-xs"
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
                    className="btn-danger"
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
                        {primary.featuredImage ? (
                          <p className="mt-1 max-w-[22rem] truncate text-xs text-[var(--muted)]">
                            thumb: {primary.featuredImage}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xs sm:text-sm">
                        {isPublished ? "published" : scheduled ? `scheduled: ${scheduled.slice(0, 10)}` : "draft"}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary min-h-8 px-3 py-1.5 text-xs"
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
                          className="btn-secondary min-h-8 px-3 py-1.5 text-xs"
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
                        className="btn-danger"
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
      ) : activeTab !== "security" ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--muted)]">
          {t("d1RequiredSection")}
        </p>
      ) : null}

      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] shadow-[var(--shadow-md)]"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
