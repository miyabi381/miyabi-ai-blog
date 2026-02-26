function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function applyColorTag(text: string) {
  const colorWhitelist = new Set([
    "red",
    "blue",
    "green",
    "orange",
    "purple",
    "pink",
    "teal",
    "gray",
    "#ff0000",
    "#0000ff",
    "#008000",
    "#ff7f00"
  ]);

  return text.replace(/\[color:([#a-zA-Z0-9]+)\]([\s\S]*?)\[\/color\]/g, (_m, rawColor: string, inner: string) => {
    const color = rawColor.toLowerCase();
    if (!colorWhitelist.has(color)) {
      return inner;
    }
    return `<span style="color:${escapeAttribute(color)}">${inner}</span>`;
  });
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
  const withUnderline = withStrong.replace(/__([^_]+)__/g, "<u>$1</u>");
  const withEmphasis = withUnderline.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const withStrike = withEmphasis.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  const withColors = applyColorTag(withStrike);

  return withColors.replace(/__CODE_(\d+)__/g, (_match, index: string) => codeTokens[Number(index)] ?? "");
}

function highlightJs(code: string) {
  const placeholders = new Map<string, string>();
  const indexToKey = (index: number) => {
    let n = index;
    let out = "";
    do {
      out = String.fromCharCode(97 + (n % 26)) + out;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return `__TOK_${out}__`;
  };
  const stash = (source: string, className: string) => {
    const key = indexToKey(placeholders.size);
    placeholders.set(key, `<span class="${className}">${escapeHtml(source)}</span>`);
    return key;
  };

  let working = code.replace(/(["'`])(?:\\.|(?!\1)[\s\S])*?\1/g, (match) => stash(match, "token-string"));
  working = working.replace(/\/\*[\s\S]*?\*\//g, (match) => stash(match, "token-comment"));
  working = working.replace(/\/\/.*$/gm, (match) => stash(match, "token-comment"));

  let text = escapeHtml(working);
  text = text.replace(
    /\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|import|from|export|async|await|try|catch|finally|throw)\b/g,
    '<span class="token-keyword">$1</span>'
  );
  text = text.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="token-number">$1</span>');

  for (const [key, html] of placeholders.entries()) {
    text = text.replaceAll(key, html);
  }
  return text;
}

function highlightCss(code: string) {
  let text = escapeHtml(code);
  text = text.replace(/([.#]?[a-zA-Z][\w-]*)\s*(\{)/g, '<span class="token-selector">$1</span> $2');
  text = text.replace(/([a-z-]+)(\s*:)/g, '<span class="token-property">$1</span>$2');
  text = text.replace(/(:\s*)(#[0-9a-fA-F]{3,8}|[a-zA-Z-]+|\d+px|\d+rem|\d+%)/g, '$1<span class="token-value">$2</span>');
  text = text.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
  return text;
}

function highlightHtml(code: string) {
  let text = escapeHtml(code);
  text = text.replace(/(&lt;\/?)([a-zA-Z0-9-]+)([^&]*?&gt;)/g, '$1<span class="token-tag">$2</span>$3');
  text = text.replace(/([a-zA-Z-:]+)=(&quot;[^&]*?&quot;)/g, '<span class="token-attr">$1</span>=<span class="token-string">$2</span>');
  return text;
}

function highlightCodeBlock(code: string, lang: string | null) {
  const normalized = (lang ?? "").toLowerCase();
  if (normalized === "js" || normalized === "javascript" || normalized === "ts" || normalized === "tsx") {
    return { html: highlightJs(code), label: normalized === "js" ? "javascript" : normalized };
  }
  if (normalized === "css") {
    return { html: highlightCss(code), label: "css" };
  }
  if (normalized === "html" || normalized === "xml") {
    return { html: highlightHtml(code), label: normalized === "xml" ? "xml" : "html" };
  }
  if (!normalized) {
    const trimmed = code.trim();
    if (/<[a-zA-Z][\w-]*(\s[^>]*)?>[\s\S]*<\/[a-zA-Z][\w-]*>|<!DOCTYPE html>/i.test(trimmed)) {
      return { html: highlightHtml(code), label: "html" };
    }
    if (/[.#]?[a-zA-Z][\w-]*\s*\{[\s\S]*:[\s\S]*;\s*}/.test(trimmed)) {
      return { html: highlightCss(code), label: "css" };
    }
    if (
      /\b(const|let|var|function|return|import|export|class|async|await)\b/.test(trimmed) ||
      /=>/.test(trimmed)
    ) {
      return { html: highlightJs(code), label: "javascript" };
    }
  }
  return { html: escapeHtml(code), label: normalized || "plain" };
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
  let codeLang: string | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";

    if (line.startsWith("```")) {
      const detectedLang = line.slice(3).trim();
      if (inCodeBlock) {
        const highlighted = highlightCodeBlock(codeBuffer.join("\n"), codeLang);
        chunks.push(
          `<div class="code-block"><span class="code-lang">${escapeAttribute(highlighted.label)}</span><pre><code class="language-${escapeAttribute(highlighted.label)}">${highlighted.html}</code></pre></div>`
        );
        codeBuffer.length = 0;
        codeLang = null;
        inCodeBlock = false;
      } else {
        flushParagraph(paragraphBuffer, chunks);
        inCodeBlock = true;
        codeLang = detectedLang || null;
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

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushParagraph(paragraphBuffer, chunks);
      chunks.push("<hr />");
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/);
    if (imageMatch) {
      flushParagraph(paragraphBuffer, chunks);
      chunks.push(
        `<figure><img src="${escapeAttribute(imageMatch[2])}" alt="${escapeAttribute(imageMatch[1])}" loading="lazy" /></figure>`
      );
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

    const checkListMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (checkListMatch) {
      flushParagraph(paragraphBuffer, chunks);
      const items = [{ checked: checkListMatch[1].toLowerCase() === "x", text: checkListMatch[2] }];
      while (i + 1 < lines.length) {
        const next = lines[i + 1] ?? "";
        const nextMatch = next.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (!nextMatch) {
          break;
        }
        items.push({ checked: nextMatch[1].toLowerCase() === "x", text: nextMatch[2] });
        i += 1;
      }
      chunks.push(
        `<ul class="checklist">${items
          .map(
            (item) =>
              `<li data-checked="${item.checked ? "true" : "false"}"><input type="checkbox" disabled ${
                item.checked ? "checked" : ""
              } /><span>${formatInline(item.text)}</span></li>`
          )
          .join("")}</ul>`
      );
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
    const highlighted = highlightCodeBlock(codeBuffer.join("\n"), codeLang);
    chunks.push(
      `<div class="code-block"><span class="code-lang">${escapeAttribute(highlighted.label)}</span><pre><code class="language-${escapeAttribute(highlighted.label)}">${highlighted.html}</code></pre></div>`
    );
  }
  flushParagraph(paragraphBuffer, chunks);

  return chunks.join("\n");
}
