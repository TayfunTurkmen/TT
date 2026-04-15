import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export type GenerateInput = {
  topic: string;
  locale: string;
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
          "_Bu taslak yerelde üretildi: `OPENAI_API_KEY` tanımlı değil._",
          "",
          "### Özet",
          "Bu bölümü kendi gözlemlerinizle doldurun. Otomatik içerik üretimi yalnızca güvenilir ortamlarda ve insan gözden geçirmesiyle yayınlanmalıdır.",
          "",
          "### Güvenlik notları",
          "- Üçüncü parti LLM çıktısını asla doğrudan prod veriye yazmayın.",
          "- Taslakları git diff ile inceleyin; gizli anahtarları repoya koymayın.",
          "",
          "```bash",
          `# Örnek: ${slug}`,
          "npm run dev",
          "```",
        ].join("\n")
      : [
          `## ${topic}`,
          "",
          "_Local stub: `OPENAI_API_KEY` is not set._",
          "",
          "### Overview",
          "Replace this section with your own research. Automated prose should always be reviewed before publication.",
          "",
          "### Security notes",
          "- Never pipe LLM output straight into production data paths.",
          "- Review diffs carefully; never commit API keys.",
          "",
          "```bash",
          `# Example: ${slug}`,
          "npm run dev",
          "```",
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
  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!openaiKey && !openrouterKey) {
    return stubMarkdown(input, slug);
  }

  const openai = openrouterKey
    ? createOpenAI({
        apiKey: openrouterKey,
        baseURL: "https://openrouter.ai/api/v1",
      })
    : createOpenAI({ apiKey: openaiKey! });
  const language = input.locale === "tr" ? "Turkish" : "English";
  const modelName = openrouterKey
    ? process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free"
    : "gpt-4o-mini";

  const { text } = await generateText({
    model: openai(modelName),
    system: `You are a senior engineer writing careful blog posts about web development and cybersecurity. Output ONLY Markdown (no YAML frontmatter). Use ## and ### headings, short paragraphs, and at most one fenced code block. Language: ${language}. Avoid hype; prefer precise, implementable guidance.`,
    prompt: `Write a practical SEO-friendly blog draft for topic: ${input.topic}\n\nInclude: clear intro, practical guidance, security notes, and conclusion.`,
    maxOutputTokens: 2500,
  });

  return text.trim();
}

export async function generateDraft(input: GenerateInput): Promise<GeneratedDraft> {
  const content = await generatePostMarkdown(input);
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

function getModelContext(): ModelContext | null {
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
  const model = getModelContext();
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
