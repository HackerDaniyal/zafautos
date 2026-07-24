interface MarkdownNode {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'strikethrough';
  content: string;
  href?: string;
}

function parseInlineMarkdown(text: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Inline code (must be checked before bold/italic to avoid conflicts)
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/);
    if (codeMatch) {
      if (codeMatch[1]) {
        nodes.push(...parseInlineMarkdown(codeMatch[1]));
      }
      nodes.push({ type: 'code', content: codeMatch[2] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold + Italic (***text***)
    const boldItalicMatch = remaining.match(/^(.*?)\*\*\*(.+?)\*\*\*/);
    if (boldItalicMatch) {
      if (boldItalicMatch[1]) {
        nodes.push(...parseInlineMarkdown(boldItalicMatch[1]));
      }
      nodes.push({ type: 'bold', content: boldItalicMatch[2] });
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Bold (**text**)
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
    if (boldMatch) {
      if (boldMatch[1]) {
        nodes.push(...parseInlineMarkdown(boldMatch[1]));
      }
      nodes.push({ type: 'bold', content: boldMatch[2] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic (*text*)
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/);
    if (italicMatch) {
      if (italicMatch[1]) {
        nodes.push(...parseInlineMarkdown(italicMatch[1]));
      }
      nodes.push({ type: 'italic', content: italicMatch[2] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Strikethrough (~~text~~)
    const strikeMatch = remaining.match(/^(.*?)~~(.+?)~~/);
    if (strikeMatch) {
      if (strikeMatch[1]) {
        nodes.push(...parseInlineMarkdown(strikeMatch[1]));
      }
      nodes.push({ type: 'strikethrough', content: strikeMatch[2] });
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Links [text](href)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      if (linkMatch[1]) {
        nodes.push(...parseInlineMarkdown(linkMatch[1]));
      }
      nodes.push({ type: 'link', content: linkMatch[2], href: linkMatch[3] });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Images ![alt](src)
    const imgMatch = remaining.match(/^(.*?)!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      if (imgMatch[1]) {
        nodes.push(...parseInlineMarkdown(imgMatch[1]));
      }
      nodes.push({ type: 'text', content: `<img src="${imgMatch[3]}" alt="${imgMatch[2]}" />` });
      remaining = remaining.slice(imgMatch[0].length);
      continue;
    }

    // No more matches - push remaining as text
    nodes.push({ type: 'text', content: remaining });
    break;
  }

  return nodes;
}

function nodesToHtml(nodes: MarkdownNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'bold':
          return `<strong>${escapeHtml(node.content)}</strong>`;
        case 'italic':
          return `<em>${escapeHtml(node.content)}</em>`;
        case 'strikethrough':
          return `<del>${escapeHtml(node.content)}</del>`;
        case 'code':
          return `<code>${escapeHtml(node.content)}</code>`;
        case 'link':
          return `<a href="${escapeHtml(node.href ?? '')}">${escapeHtml(node.content)}</a>`;
        case 'text':
          return node.content;
      }
    })
    .join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseBlockMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Code block (```)
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      htmlParts.push(`<pre><code${langAttr}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = nodesToHtml(parseInlineMarkdown(headingMatch[2]));
      htmlParts.push(`<h${level}>${content}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      htmlParts.push('<hr />');
      i++;
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*[-*+]\s/.test(lines[i])) {
        const itemContent = lines[i].replace(/^[\s]*[-*+]\s/, '');
        items.push(`<li>${nodesToHtml(parseInlineMarkdown(itemContent))}</li>`);
        i++;
      }
      htmlParts.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^[\s]*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*\d+\.\s/.test(lines[i])) {
        const itemContent = lines[i].replace(/^[\s]*\d+\.\s/, '');
        items.push(`<li>${nodesToHtml(parseInlineMarkdown(itemContent))}</li>`);
        i++;
      }
      htmlParts.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const quoteContent = parseBlockMarkdown(quoteLines.join('\n'));
      htmlParts.push(`<blockquote>${quoteContent}</blockquote>`);
      continue;
    }

    // Paragraph - collect consecutive non-empty, non-special lines
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !/^[\s]*[-*+]\s/.test(lines[i]) &&
      !/^[\s]*\d+\.\s/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    if (paragraphLines.length > 0) {
      const content = nodesToHtml(parseInlineMarkdown(paragraphLines.join(' ')));
      htmlParts.push(`<p>${content}</p>`);
    }
  }

  return htmlParts.join('\n');
}

/**
 * Converts markdown text to HTML.
 * Handles headings, bold, italic, links, images, lists, code blocks, blockquotes.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  return parseBlockMarkdown(markdown);
}

/**
 * Converts HTML back to markdown (best-effort).
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let md = html;

  // Decode HTML entities
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#039;/g, "'");

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Bold and Italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');
  md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');

  // Code
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```');
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```');

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Images
  md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Lists
  md = md.replace(/<ul[^>]*>/gi, '');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Blockquote
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_match, content: string) => {
    const lines = content.trim().split('\n');
    return lines.map((line: string) => `> ${line}`).join('\n') + '\n\n';
  });

  // Horizontal rule
  md = md.replace(/<hr\s*\/?>/gi, '---\n\n');

  // Paragraphs and breaks
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode entities again (for nested)
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');

  // Clean up excessive whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();

  return md;
}

/**
 * Strips all markdown formatting, returning plain text.
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // Code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Links
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Headings
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');

  // Italic
  text = text.replace(/\*([^*]+)\*/g, '$1');

  // Strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // Blockquotes
  text = text.replace(/^>\s?/gm, '');

  // Horizontal rules
  text = text.replace(/^(-{3,}|\*{3,}|_{3,})\s*$/gm, '');

  // List markers
  text = text.replace(/^[\s]*[-*+]\s/gm, '');
  text = text.replace(/^[\s]*\d+\.\s/gm, '');

  // Excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Truncates markdown to a maximum character length while respecting markdown syntax.
 */
export function truncateMarkdown(markdown: string, maxLength: number): string {
  if (!markdown || markdown.length <= maxLength) return markdown;

  // Strip to plain text, truncate, then return
  const plain = stripMarkdown(markdown);
  if (plain.length <= maxLength) return markdown;

  // Truncate by characters, trying to break at word boundary
  let truncated = markdown.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    truncated = truncated.slice(0, lastSpace);
  }

  // Try to avoid cutting inside inline formatting
  const unclosedBold = (truncated.match(/\*\*/g) ?? []).length % 2 !== 0;
  if (unclosedBold) {
    truncated = truncated.replace(/\*{1,2}[^*]*$/, '');
  }

  const unclosedItalic = (truncated.match(/(?<!\*)\*(?!\*)/g) ?? []).length % 2 !== 0;
  if (unclosedItalic) {
    truncated = truncated.replace(/\*[^*]*$/, '');
  }

  const unclosedCode = (truncated.match(/`/g) ?? []).length % 2 !== 0;
  if (unclosedCode) {
    truncated = truncated.replace(/`[^`]*$/, '');
  }

  // Add ellipsis if we actually truncated
  if (truncated.length < markdown.length) {
    truncated += '...';
  }

  return truncated;
}
