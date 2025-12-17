/**
 * Markdown Component
 *
 * Renders markdown content with safe HTML output and syntax highlighting.
 * Per 05-frontend-components.md spec: "Markdown rendering with syntax highlighting"
 */

import React, { useMemo, useEffect, useRef } from 'react';

export interface MarkdownProps {
  /** Markdown content to render */
  content: string;
  /** Allow only inline formatting (no blocks) */
  inline?: boolean;
  /** Enable syntax highlighting for code blocks */
  syntaxHighlight?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Simple syntax highlighter for common languages
 * Highlights keywords, strings, comments, numbers
 */
function highlightCode(code: string, language: string): string {
  if (!language) return escapeHtml(code);

  let highlighted = escapeHtml(code);

  // Language-specific keywords
  const keywords: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'export', 'import', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'],
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'export', 'import', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'interface', 'type', 'enum', 'implements', 'extends', 'public', 'private', 'protected', 'readonly'],
    python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'self'],
    php: ['function', 'class', 'if', 'else', 'elseif', 'for', 'foreach', 'while', 'return', 'public', 'private', 'protected', 'static', 'new', 'try', 'catch', 'throw', 'use', 'namespace', 'true', 'false', 'null', 'echo', 'print', 'array'],
    css: ['color', 'background', 'border', 'margin', 'padding', 'font', 'display', 'position', 'width', 'height', 'top', 'left', 'right', 'bottom', 'flex', 'grid', 'transition', 'transform', 'animation'],
    sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT'],
    json: [],
    html: [],
    bash: ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'echo', 'exit', 'export', 'source', 'cd', 'ls', 'cat', 'grep', 'sed', 'awk'],
  };

  const langKeywords = keywords[language.toLowerCase()] || keywords['javascript'] || [];

  // Highlight strings (single and double quotes)
  highlighted = highlighted.replace(
    /(&quot;[^&]*&quot;|&#039;[^&]*&#039;|"[^"]*"|'[^']*')/g,
    '<span class="n8n-chat-hl-string">$1</span>'
  );

  // Highlight comments (// and /* */ and #)
  highlighted = highlighted.replace(
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g,
    '<span class="n8n-chat-hl-comment">$1</span>'
  );

  // Highlight numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span class="n8n-chat-hl-number">$1</span>'
  );

  // Highlight keywords
  if (langKeywords.length > 0) {
    const keywordRegex = new RegExp(`\\b(${langKeywords.join('|')})\\b`, 'g');
    highlighted = highlighted.replace(
      keywordRegex,
      '<span class="n8n-chat-hl-keyword">$1</span>'
    );
  }

  // Highlight function calls
  highlighted = highlighted.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    '<span class="n8n-chat-hl-function">$1</span>('
  );

  return highlighted;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Simple markdown parser for chat messages.
 * Supports: **bold**, *italic*, `code`, [links](url), \n for line breaks
 *
 * Note: For production, consider using a library like marked or remark
 * with sanitization for security.
 */
function parseMarkdown(text: string, inline: boolean = false, syntaxHighlight: boolean = true): string {
  let html = text;

  // Code blocks (``` ... ```) - process BEFORE escaping HTML
  if (!inline) {
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const highlightedCode = syntaxHighlight
        ? highlightCode(code.trim(), lang)
        : escapeHtml(code.trim());
      const langClass = lang ? ` language-${lang}` : '';
      return `<pre class="n8n-chat-code-block${langClass}" data-language="${lang}"><code>${highlightedCode}</code></pre>`;
    });
  }

  // Now escape remaining HTML (but not our inserted tags)
  // Split on code blocks to avoid double-escaping
  const parts = html.split(/(<pre class="n8n-chat-code-block[\s\S]*?<\/pre>)/);
  html = parts.map((part, i) => {
    // Odd indices are code blocks, keep as-is
    if (i % 2 === 1) return part;
    // Even indices are regular text, escape HTML
    return part
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }).join('');

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="n8n-chat-inline-code">$1</code>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough (~~text~~)
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="n8n-chat-link">$1</a>'
  );

  // Auto-link URLs (only plain URLs not already in markdown links)
  html = html.replace(
    /(?<!href="|">)(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="n8n-chat-link">$1</a>'
  );

  if (!inline) {
    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3 class="n8n-chat-h3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="n8n-chat-h2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="n8n-chat-h1">$1</h1>');

    // Unordered lists
    html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="n8n-chat-list">$&</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote class="n8n-chat-blockquote">$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr class="n8n-chat-hr">');

    // Line breaks -> paragraphs
    html = html
      .split(/\n\n+/)
      .map((para) => {
        const trimmed = para.trim();
        // Don't wrap block elements
        if (
          trimmed.startsWith('<pre') ||
          trimmed.startsWith('<ul') ||
          trimmed.startsWith('<ol') ||
          trimmed.startsWith('<h') ||
          trimmed.startsWith('<blockquote') ||
          trimmed.startsWith('<hr')
        ) {
          return trimmed;
        }
        return `<p>${trimmed}</p>`;
      })
      .join('\n');
  }

  // Single line breaks -> <br>
  html = html.replace(/\n/g, '<br>');

  // Clean up multiple <br> tags
  html = html.replace(/(<br>){3,}/g, '<br><br>');

  return html;
}

/**
 * Markdown component for rendering formatted text
 */
export function Markdown({ content, inline = false, syntaxHighlight = true, className = '' }: MarkdownProps) {
  const html = useMemo(() => parseMarkdown(content, inline, syntaxHighlight), [content, inline, syntaxHighlight]);

  const classes = [
    'n8n-chat-markdown',
    inline ? 'n8n-chat-markdown-inline' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (inline) {
    return (
      <span className={classes} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  return (
    <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export default Markdown;
