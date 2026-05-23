import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function LessonContent({ content }: { content: string }) {
  if (!content?.trim()) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Bài học này không có nội dung văn bản.
      </p>
    );
  }

  return (
    <article className="prose-content max-w-none text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold mt-5 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold mt-4 mb-2">{children}</h4>
          ),
          p: ({ children }) => <p className="leading-7 mb-4">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary bg-primary/5 pl-4 py-2 my-4 italic">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code
                className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="rounded-lg bg-muted p-4 overflow-x-auto my-4 text-sm">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold border-b">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-b last:border-0">{children}</td>
          ),
          hr: () => <hr className="my-8 border-border" />,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
