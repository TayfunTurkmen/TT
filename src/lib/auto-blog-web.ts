import type { GeneratedDraft, LocaleCode } from "@/lib/auto-blog";
import { extractKeywords, extractSentences, fetchPageText } from "@/lib/web-fetch";

function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function seoClip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function buildMarkdownEn(params: {
  topic: string;
  keywords: string[];
  sentences: string[];
  sources: { url: string; title: string }[];
}): string {
  const kw = params.keywords.length ? params.keywords.join(", ") : "web development, security";
  const lines: string[] = [];

  lines.push(`# ${params.topic}`);
  lines.push("");
  lines.push(
    `This article synthesizes recent public material on **${params.topic}** with a security-first engineering lens. It is intended as editorial analysis, not a verbatim reproduction of sources.`,
  );
  lines.push("");
  lines.push("## Key takeaways");
  if (params.sentences.length) {
    for (const s of params.sentences.slice(0, 6)) {
      lines.push(`- ${s}`);
    }
  } else {
    lines.push(`- Focus on measurable outcomes when exploring ${params.topic}.`);
    lines.push("- Prefer incremental changes with observability and rollback.");
    lines.push("- Treat third-party content as untrusted input until reviewed.");
  }
  lines.push("");
  lines.push("## Practical guidance");
  lines.push(
    `When shipping work related to **${params.topic}**, align architecture with least privilege, explicit validation, and clear ownership. Keywords surfaced from reviewed pages include: ${kw}.`,
  );
  lines.push("");
  lines.push("### Checklist");
  lines.push("- [ ] Threat model the data paths (auth, storage, logs).");
  lines.push("- [ ] Add security headers and safe defaults for frameworks you use.");
  lines.push("- [ ] Monitor anomalies and keep dependencies patched.");
  lines.push("");
  lines.push("## FAQ");
  lines.push(`### What is ${params.topic} in practice?`);
  lines.push(
    `It depends on context, but teams usually optimize for reliability, clarity, and defensibility—especially when handling user data.`,
  );
  lines.push("");
  lines.push(`### What should I verify before publishing?`);
  lines.push(
    "Accuracy, licensing for any quoted material, and that operational guidance matches your environment.",
  );
  lines.push("");
  lines.push("## Sources");
  if (params.sources.length) {
    params.sources.forEach((s, i) => {
      lines.push(`${i + 1}. [${s.title}](${s.url})`);
    });
  } else {
    lines.push("_No sources could be retrieved._");
  }
  lines.push("");
  lines.push("---");
  lines.push(
    "_Research mode: generated without external LLM APIs. Review for accuracy, tone, and rights before publishing._",
  );

  return lines.join("\n");
}

function buildMarkdownTr(params: {
  topic: string;
  keywords: string[];
  sentences: string[];
  sources: { url: string; title: string }[];
}): string {
  const kw = params.keywords.length ? params.keywords.join(", ") : "web geliştirme, güvenlik";
  const lines: string[] = [];

  lines.push(`# ${params.topic}`);
  lines.push("");
  lines.push(
    `Bu yazı, **${params.topic}** konusunda kamuya açık kaynaklardan derlenen gözlemleri güvenlik odaklı bir mühendislik çerçevesinde bir araya getirir. Amaç doğrudan kopya içerik üretmek değil; özgün bir editoryal özet ve uygulanabilir kontrol listesi sunmaktır.`,
  );
  lines.push("");
  lines.push("## Öne çıkan bulgular");
  if (params.sentences.length) {
    for (const s of params.sentences.slice(0, 6)) {
      lines.push(`- ${s}`);
    }
  } else {
    lines.push(`- ${params.topic} için ölçülebilir hedefler tanımlayın.`);
    lines.push("- Küçük adımlarla ilerleyin; geri alınabilir değişiklikleri tercih edin.");
    lines.push("- Üçüncü taraf içeriğini güvenilir kabul etmeyin; doğrulayın.");
  }
  lines.push("");
  lines.push("## Pratik rehber");
  lines.push(
    `**${params.topic}** üzerinde çalışırken mimariyi en ayrıcalıklı erişim, açık doğrulama ve net sorumluluklarla hizalayın. İncelenen sayfalardan çıkan anahtar kelimeler: ${kw}.`,
  );
  lines.push("");
  lines.push("### Kontrol listesi");
  lines.push("- [ ] Veri yollarını tehdit modeliyle gözden geçirin (kimlik doğrulama, depolama, loglar).");
  lines.push("- [ ] Güvenlik başlıkları ve güvenli varsayılanları etkinleştirin.");
  lines.push("- [ ] Bağımlılıkları güncel tutun ve anomalileri izleyin.");
  lines.push("");
  lines.push("## Sık sorulan sorular");
  lines.push(`### ${params.topic} pratikte ne anlama gelir?`);
  lines.push(
    "Bağlama göre değişir; çoğu ekip güvenilirlik, sade mimari ve savunulabilir operasyon önceliklendirir.",
  );
  lines.push("");
  lines.push("### Yayınlamadan önce neyi doğrulamalıyım?");
  lines.push(
    "Doğruluğu, alıntı haklarını ve operasyonel tavsiyelerin kendi ortamınıza uyduğunu kontrol edin.",
  );
  lines.push("");
  lines.push("## Kaynaklar");
  if (params.sources.length) {
    params.sources.forEach((s, i) => {
      lines.push(`${i + 1}. [${s.title}](${s.url})`);
    });
  } else {
    lines.push("_Kaynak içeriği alınamadı._");
  }
  lines.push("");
  lines.push("---");
  lines.push(
    "_Araştırma modu: harici LLM API’si kullanılmadan üretildi. Yayın öncesi doğruluk, ton ve telif açısından gözden geçirin._",
  );

  return lines.join("\n");
}

function toExcerpt(md: string, locale: "en" | "tr"): string {
  const plain = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/#+\s/g, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const sliced = plain.slice(0, 158);
  if (!sliced) {
    return locale === "tr"
      ? "Kaynaklardan derlenen SEO odaklı taslak — yayınlamadan önce gözden geçirin."
      : "SEO-focused draft from public sources — review before publishing.";
  }
  return sliced;
}

export async function buildWebDualDrafts(
  topic: string,
  baseLocale: LocaleCode,
  rawUrls: string[],
): Promise<
  | {
      ok: true;
      sharedSlug: string;
      base: GeneratedDraft;
      other: GeneratedDraft;
    }
  | { ok: false; error: string }
> {
  const urls = rawUrls.map((u) => u.trim()).filter(Boolean).slice(0, 5);
  if (!urls.length) {
    return { ok: false, error: "no-urls" };
  }

  const results = await Promise.all(urls.map((u) => fetchPageText(u)));
  const okPages = results.filter((r): r is Extract<typeof r, { ok: true }> => r.ok);
  if (!okPages.length) {
    return { ok: false, error: "fetch-all-failed" };
  }

  const combinedText = okPages.map((p) => p.text).join("\n\n");
  const sentences = extractSentences(combinedText, 10);
  const kwEn = extractKeywords(combinedText, "en", 8);
  const kwTr = extractKeywords(combinedText, "tr", 8);

  const sources = okPages.map((p) => ({ url: p.url, title: p.title }));

  const sharedSlug = slugifyTopic(topic) || "research-draft";

  const enMd = buildMarkdownEn({
    topic,
    keywords: kwEn,
    sentences,
    sources,
  });
  const trMd = buildMarkdownTr({
    topic,
    keywords: kwTr,
    sentences,
    sources,
  });

  const draftEn: GeneratedDraft = {
    title: topic,
    excerpt: toExcerpt(enMd, "en"),
    content: enMd,
    tags: ["research", "seo", "web", ...kwEn.slice(0, 4)],
    seoTitle: seoClip(`${topic} | Research notes`, 60),
    seoDescription: seoClip(toExcerpt(enMd, "en"), 155),
  };

  const draftTr: GeneratedDraft = {
    title: topic,
    excerpt: toExcerpt(trMd, "tr"),
    content: trMd,
    tags: ["araştırma", "seo", "web", ...kwTr.slice(0, 4)],
    seoTitle: seoClip(`${topic} | Araştırma notları`, 60),
    seoDescription: seoClip(toExcerpt(trMd, "tr"), 155),
  };

  const base = baseLocale === "en" ? draftEn : draftTr;
  const other = baseLocale === "en" ? draftTr : draftEn;

  return { ok: true, sharedSlug, base, other };
}
