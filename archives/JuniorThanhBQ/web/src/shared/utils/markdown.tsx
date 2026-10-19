import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-extrabold text-blue-600 dark:text-blue-400">{children}</strong>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank" rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-500 transition-colors break-all"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-rose-600 dark:text-rose-400">
            {children}
          </code>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-xl border border-solid border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-slate-100 dark:bg-slate-800 border-b border-solid border-slate-200 dark:border-slate-700">
            {children}
          </thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-solid border-slate-200 dark:border-slate-800 last:border-0 even:bg-slate-50/50 dark:even:bg-slate-900/10">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 font-bold text-slate-850 dark:text-slate-200">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-slate-700 dark:text-slate-350">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
