import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
  },
};

type Props = {
  markdown: string;
};

export function MarkdownContent({ markdown }: Props) {
  return (
    <article className="prose-doc">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, schema]]}>
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
