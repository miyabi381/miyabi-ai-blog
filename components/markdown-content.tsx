import { renderMarkdownToHtml } from "@/lib/markdown";

type MarkdownContentProps = {
  markdown: string;
  className?: string;
};

export function MarkdownContent({ markdown, className = "" }: MarkdownContentProps) {
  const html = renderMarkdownToHtml(markdown);
  return <div className={`markdown-body ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
}
