import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { buildWebDualDrafts } from "@/lib/auto-blog-web";
import { getAdminAiSettings } from "@/lib/d1";

export type GenerateInput = {
  topic: string;
  locale: string;
  /** Public HTTPS URLs to fetch and synthesize (no LLM API required). */
  sourceUrls?: string[];
};

export type GeneratedDraft = {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
};

export type LocaleCode = "en" | "tr";

function slugify(topic: string): string {
  const base = topic
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, 80) || "draft";
}

function stubMarkdown({ topic, locale }: GenerateInput, slug: string) {
  const body =
    locale === "tr"
      ? [
          `## ${topic}`,
          "",
          "_Yerel AI modu: API key olmadan hızlı taslak üretimi._",
          "",
          "### Özet",
          `${topic} konusunda pratik, uygulanabilir ve güvenlik odaklı bir yaklaşım öneriyoruz. Bu taslak doğrudan yayın yerine editör gözünden geçirilmelidir.`,
          "",
          "### Uygulama adımları",
          "1. Problemi ve hedef metriği netleştirin.",
          "2. Küçük adımlarla değişiklik yapıp her adımı test edin.",
          "3. Güvenlik başlıkları ve loglama politikasını en başta tanımlayın.",
          "",
          "### Güvenlik notları",
          "- Gizli anahtarları istemci tarafına taşımayın.",
          "- Kullanıcı girdisini doğrulamadan veri tabanına yazmayın.",
          "- Otomasyon çıktısını yayınlamadan önce manuel kontrol edin.",
          "",
          "```bash",
          `# local draft: ${slug}`,
          "npm run dev",
          "```",
          "",
          "### Sonuç",
          "Bu yaklaşım, hız ve güvenlik arasında daha dengeli bir geliştirme süreci sağlar.",
        ].join("\n")
      : [
          `## ${topic}`,
          "",
          "_Local AI mode: fast draft generation without API keys._",
          "",
          "### Overview",
          `This draft outlines a practical, security-first way to approach ${topic}. Treat it as a starting point and review before publishing.`,
          "",
          "### Implementation steps",
          "1. Define the goal and measurable outcome.",
          "2. Ship in small increments and test each change.",
          "3. Set security controls and observability early.",
          "",
          "### Security notes",
          "- Never expose secrets to client-side code.",
          "- Validate input before writing to storage.",
          "- Review automated drafts before publishing.",
          "",
          "```bash",
          `# local draft: ${slug}`,
          "npm run dev",
          "```",
          "",
          "### Conclusion",
          "This workflow keeps delivery speed high while reducing avoidable security risk.",
        ].join("\n");

  return body;
}

function toExcerpt(content: string, locale: string): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/#+\s/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sliced = plain.slice(0, 160);
  if (!sliced) {
    return locale === "tr"
      ? "AI destekli taslak - gözden geçirip yayınlayın."
      : "AI-assisted draft - review before publishing.";
  }
  return sliced;
}

export async function generatePostMarkdown(input: GenerateInput): Promise<string> {
  const slug = slugify(input.topic);
  const model = await getModelContext();
  if (!model) {
    return stubMarkdown(input, slug);
  }
  const language = input.locale === "tr" ? "Turkish" : "English";

  const { text } = await generateText({
    model: model.openai(model.modelName),
    system: `You are a senior engineer writing careful blog posts about web development and cybersecurity. Output ONLY Markdown (no YAML frontmatter). Use ## and ### headings, short paragraphs, and at most one fenced code block. Language: ${language}. Avoid hype; prefer precise, implementable guidance.`,
    prompt: `Write a practical SEO-friendly blog draft for topic: ${input.topic}\n\nInclude: clear intro, practical guidance, security notes, and conclusion.`,
    maxOutputTokens: 2500,
  });

  return text.trim();
}

export async function generateDraft(input: GenerateInput): Promise<GeneratedDraft> {
  const urls = input.sourceUrls?.map((u) => u.trim()).filter(Boolean).slice(0, 5) ?? [];
  if (urls.length && (input.locale === "en" || input.locale === "tr")) {
    const web = await buildWebDualDrafts(input.topic, input.locale, urls);
    if (web.ok) return web.base;
  }

  const content = await generatePostMarkdown({ ...input, sourceUrls: undefined });
  const excerpt = toExcerpt(content, input.locale);

  return {
    title: input.topic,
    excerpt,
    content,
    tags: ["ai", "scheduled", "web", "security"],
    seoTitle: input.topic.length > 58 ? `${input.topic.slice(0, 55)}...` : input.topic,
    seoDescription: excerpt,
  };
}

type ModelContext = {
  openai: ReturnType<typeof createOpenAI>;
  modelName: string;
};

async function getModelContext(): Promise<ModelContext | null> {
  const admin = await getAdminAiSettings();
  if (admin.aiApiBaseUrl && admin.aiApiKey) {
    return {
      openai: createOpenAI({
        apiKey: admin.aiApiKey,
        baseURL: admin.aiApiBaseUrl,
      }),
      modelName: admin.aiModel || "gpt-4o-mini",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openaiKey && !openrouterKey) return null;

  const openai = openrouterKey
    ? createOpenAI({
        apiKey: openrouterKey,
        baseURL: "https://openrouter.ai/api/v1",
      })
    : createOpenAI({ apiKey: openaiKey! });

  const modelName = openrouterKey
    ? process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free"
    : "gpt-4o-mini";

  return { openai, modelName };
}

export async function translateDraft(
  source: GeneratedDraft,
  fromLocale: LocaleCode,
  toLocale: LocaleCode,
): Promise<GeneratedDraft> {
  if (fromLocale === toLocale) return source;
  const model = await getModelContext();
  if (!model) {
    return {
      ...source,
      title: `[${toLocale.toUpperCase()}] ${source.title}`,
      excerpt: source.excerpt,
      seoTitle: `[${toLocale.toUpperCase()}] ${source.seoTitle}`,
      seoDescription: source.seoDescription,
    };
  }

  const toLanguage = toLocale === "tr" ? "Turkish" : "English";
  const fromLanguage = fromLocale === "tr" ? "Turkish" : "English";

  const { text } = await generateText({
    model: model.openai(model.modelName),
    system:
      "You are a precise technical translator for web development and cybersecurity content. Return STRICT JSON with keys: title, excerpt, content, seoTitle, seoDescription. Keep markdown in content. Preserve meaning, examples, and technical terms.",
    prompt: `Translate from ${fromLanguage} to ${toLanguage}.\n\nSOURCE_JSON:\n${JSON.stringify(
      source,
    )}`,
    maxOutputTokens: 2500,
  });

  try {
    const parsed = JSON.parse(text.trim()) as Partial<GeneratedDraft>;
    return {
      title: parsed.title?.trim() || source.title,
      excerpt: parsed.excerpt?.trim() || source.excerpt,
      content: parsed.content?.trim() || source.content,
      tags: source.tags,
      seoTitle: parsed.seoTitle?.trim() || parsed.title?.trim() || source.seoTitle,
      seoDescription:
        parsed.seoDescription?.trim() || parsed.excerpt?.trim() || source.seoDescription,
    };
  } catch {
    return {
      ...source,
      title: `[${toLocale.toUpperCase()}] ${source.title}`,
      seoTitle: `[${toLocale.toUpperCase()}] ${source.seoTitle}`,
    };
  }
}
