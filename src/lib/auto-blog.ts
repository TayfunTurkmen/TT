import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

type GenerateInput = {
  topic: string;
  locale: string;
};

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
  const date = new Date().toISOString().slice(0, 10);
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

  return [
    "---",
    `title: "${topic.replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `excerpt: "Auto-generated draft — human review required."`,
    `tags: ["draft","auto-blog"]`,
    "---",
    "",
    body,
  ].join("\n");
}

export async function generatePostMarkdown(input: GenerateInput): Promise<string> {
  const slug = slugify(input.topic);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return stubMarkdown(input, slug);
  }

  const openai = createOpenAI({ apiKey });
  const language = input.locale === "tr" ? "Turkish" : "English";

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `You are a senior engineer writing careful blog posts about web development and cybersecurity. Output ONLY Markdown (no YAML frontmatter). Use ## and ### headings, short paragraphs, and at most one fenced code block. Language: ${language}. Avoid hype; prefer precise, implementable guidance.`,
    prompt: `Write a blog post for this topic: ${input.topic}\n\nInclude: overview, practical guidance, security considerations, conclusion.`,
    maxOutputTokens: 2500,
  });

  const date = new Date().toISOString().slice(0, 10);
  const frontmatter = [
    "---",
    `title: "${input.topic.replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `excerpt: "AI-assisted draft — review before publish."`,
    `tags: ["draft","auto-blog"]`,
    "---",
    "",
  ].join("\n");

  return frontmatter + text.trim();
}
