import type { BlogItem } from '../hooks/useBlogs'

interface BlogHeroProps {
  blog: BlogItem
}

export function BlogHero({ blog }: BlogHeroProps) {
  return (
    <div className="relative w-full mb-16 pb-12 border-0 border-b border-solid border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
        <div className="lg:col-span-7 overflow-hidden rounded-2xl aspect-[16/10] bg-slate-100 dark:bg-slate-900 border border-solid border-slate-100 dark:border-slate-800">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
              {blog.category}
            </span>
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
              {blog.readTime}
            </span>
          </div>

          <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight font-serif tracking-tight">
            {blog.title}
          </h2>

          <p className="mt-4 text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-normal text-justify">
            {blog.excerpt}
          </p>
        </div>
      </div>
    </div>
  )
}
