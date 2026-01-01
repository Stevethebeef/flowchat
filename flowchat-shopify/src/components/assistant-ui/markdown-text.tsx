import type { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownTextProps {
  text: string;
}

export const MarkdownText: FC<MarkdownTextProps> = ({ text }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="fc-prose fc-prose-sm fc-max-w-none fc-prose-p:leading-relaxed fc-prose-pre:p-0"
      components={{
        p: ({ children }) => <p className="fc-mb-2 fc-last:mb-0">{children}</p>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="fc-text-primary fc-underline fc-underline-offset-2"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="fc-list-disc fc-pl-4 fc-mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="fc-list-decimal fc-pl-4 fc-mb-2">{children}</ol>,
        li: ({ children }) => <li className="fc-mb-1">{children}</li>,
        code: ({ children }) => (
          <code className="fc-bg-muted fc-px-1 fc-py-0.5 fc-rounded fc-text-xs">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="fc-bg-muted fc-p-3 fc-rounded-lg fc-overflow-x-auto fc-mb-2">
            {children}
          </pre>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};
