import type { BlogItem } from '../hooks/useBlogs'

interface BlogCardProps {
  blog: BlogItem
}

export function BlogCard({ blog }: BlogCardProps) {
  return (
    <article className="relative flex flex-col justify-between w-full h-full pb-6 border-0 border-b border-solid border-slate-100 dark:border-slate-800">
      <div className="flex flex-col">
        <div className="overflow-hidden rounded-2xl aspect-[16/10] bg-slate-50 dark:bg-slate-900 border border-solid border-slate-100 dark:border-slate-800">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 font-mono">
            {blog.category}
          </span>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono">
            {blog.readTime}
          </span>
        </div>

        <h3 className="mt-3 text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-snug font-serif">
          {blog.title}
        </h3>

        <p className="mt-3 text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
          {blog.excerpt}
        </p>
      </div>
    </article>
  )
}
