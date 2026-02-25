function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatInline(text: string) {
  const escaped = escapeHtml(text);
  const codeTokens: string[] = [];
  const withCodeTokens = escaped.replace(/`([^`]+)`/g, (_match, group: string) => {
    const token = `__CODE_${codeTokens.length}__`;
    codeTokens.push(`<code>${group}</code>`);
    return token;
  });

  const withLinks = withCodeTokens.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label: string, url: string) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  const withStrong = withLinks.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const withEmphasis = withStrong.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const withStrike = withEmphasis.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  return withStrike.replace(/__CODE_(\d+)__/g, (_match, index: string) => codeTokens[Number(index)] ?? "");
}

function flushParagraph(buffer: string[], chunks: string[]) {
  if (buffer.length === 0) {
    return;
  }
  chunks.push(`<p>${buffer.map((line) => formatInline(line)).join("<br />")}</p>`);
  buffer.length = 0;
}

export function renderMarkdownToHtml(markdown: string) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const chunks: string[] = [];
  const paragraphBuffer: string[] = [];
  let inCodeBlock = false;
  const codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        chunks.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer.length = 0;
        inCodeBlock = false;
      } else {
        flushParagraph(paragraphBuffer, chunks);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph(paragraphBuffer, chunks);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph(paragraphBuffer, chunks);
      const level = headingMatch[1].length;
      chunks.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const blockquoteMatch = line.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushParagraph(paragraphBuffer, chunks);
      chunks.push(`<blockquote><p>${formatInline(blockquoteMatch[1])}</p></blockquote>`);
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph(paragraphBuffer, chunks);
      const items = [ulMatch[1]];
      while (i + 1 < lines.length) {
        const next = lines[i + 1] ?? "";
        const nextMatch = next.match(/^[-*]\s+(.+)$/);
        if (!nextMatch) {
          break;
        }
        items.push(nextMatch[1]);
        i += 1;
      }
      chunks.push(`<ul>${items.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph(paragraphBuffer, chunks);
      const items = [olMatch[1]];
      while (i + 1 < lines.length) {
        const next = lines[i + 1] ?? "";
        const nextMatch = next.match(/^\d+\.\s+(.+)$/);
        if (!nextMatch) {
          break;
        }
        items.push(nextMatch[1]);
        i += 1;
      }
      chunks.push(`<ol>${items.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    paragraphBuffer.push(line);
  }

  if (inCodeBlock) {
    chunks.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  }
  flushParagraph(paragraphBuffer, chunks);

  return chunks.join("\n");
}
