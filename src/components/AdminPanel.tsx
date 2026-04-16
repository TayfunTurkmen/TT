"use client";

import {
  deleteAdminPost,
  generateEditorDraft,
  generateBulkAiDrafts,
  publishAdminPost,
  runCronNow,
  saveMarketingSettings,
  saveAdminPost,
  setupInitialAdmin,
  unlockAdmin,
} from "@/app/actions/admin";
import { useRouter } from "next/navigation";
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

type CronEntry = {
  id: number;
  source: string;
  ok: boolean;
  publishedCount: number;
  error: string | null;
  createdAt: string;
};

type EditorBlock = {
  id: string;
  type: "heading" | "paragraph" | "list" | "quote" | "code";
  value: string;
};

export function AdminPanel({
  enabled,
  hasAdminUser,
  unlocked,
  initialPosts,
  initialCronRuns,
  initialSettings,
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
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);

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
            </div>
            <button
              type="submit"
              disabled={pending}
              className="mt-4 rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t("saveSettings")}
            </button>
          </form>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6">
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

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
              {t("builderTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("builderLead")}</p>
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
            className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6"
            action={(fd) => {
              fd.set("locale", locale);
              setMessage(null);
              start(async () => {
                const res = await saveAdminPost(fd);
                setMessage(res.ok ? t("saved") : t("error"));
                if (res.ok) router.refresh();
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
              <input
                name="slug"
                placeholder={t("slug")}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
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

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--chip)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text)]">
              {t("listTitle")}
            </h2>
            {initialPosts.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">{t("empty")}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {initialPosts.map((post) => (
                  <li
                    key={`${post.locale}-${post.slug}`}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <span>
                      [{post.locale}] {post.title} ({post.slug})
                    </span>
                    <span className="text-xs sm:text-sm">
                      {post.published
                        ? "published"
                        : post.scheduledFor
                          ? `scheduled: ${post.scheduledFor.slice(0, 10)}`
                          : "draft"}
                    </span>
                    {!post.published ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setMessage(null);
                          start(async () => {
                            const res = await publishAdminPost(post.locale, post.slug);
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
                          const res = await deleteAdminPost(post.locale, post.slug);
                          setMessage(res.ok ? t("deleted") : t("error"));
                          if (res.ok) router.refresh();
                        });
                      }}
                      className="rounded-lg border border-[#ff8a8a] bg-[#2b1111] px-3 py-1.5 text-xs font-semibold text-[#ffb4b4] disabled:opacity-50"
                    >
                      {t("delete")}
                    </button>
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
