import { motion, type MotionValue } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { ProjectItem } from '../hooks/useProjects'

interface ProjectCardProps {
  project: ProjectItem
  index: number
  total: number
  imageX?: MotionValue<string>
}

const ExternalLinkIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const linkClass = "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-850 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 transition-colors duration-300 font-mono no-underline cursor-pointer"

export function ProjectCard({ project, index, total, imageX }: ProjectCardProps) {
  const { t } = useTranslation()
  const counter = `0${index + 1} / 0${total}`

  // Desktop Horizontal Slide
  if (imageX) {
    return (
      <div className="relative w-screen h-full flex-shrink-0 flex items-center justify-center bg-transparent px-12 lg:px-16 xl:px-24 select-none">
        <div className="max-w-6xl w-full h-[65vh] flex rounded-[2rem] overflow-hidden border border-solid border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl dark:shadow-slate-950/50">

          {/* Image Block */}
          <div className="relative w-[52%] h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
            <motion.img
              src={project.coverImage}
              alt={project.title}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover scale-110"
              style={{ x: imageX }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/40 dark:to-slate-900/40 pointer-events-none" />
          </div>

          {/* Description Block */}
          <div className="w-[48%] h-full flex flex-col justify-center p-8 lg:p-10 xl:p-14 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                {counter}
              </span>
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {project.completedAt}
              </span>
            </div>

            {project.featured && (
              <span className="mt-3.5 inline-block text-[10px] font-extrabold font-mono text-blue-600 dark:text-blue-400 uppercase tracking-widest border border-solid border-blue-600/30 dark:border-blue-400/30 bg-blue-500/5 px-2.5 py-0.5 rounded-full w-fit">
                {t('project.featured')}
              </span>
            )}

            <h3 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight mt-4 text-slate-900 dark:text-white">
              {project.title}
            </h3>

            <p className="text-sm xl:text-base text-slate-650 dark:text-slate-350 mt-3 leading-relaxed font-light">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold font-mono text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 px-2.5 py-1 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 mt-6 pt-2">
              <a href={project.githubUrl} target="_blank" rel="noreferrer" className={`${linkClass} text-xs xl:text-sm`}>
                {t('project.code')} <ExternalLinkIcon />
              </a>
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className={`${linkClass} text-xs xl:text-sm`}>
                  {t('project.live_demo')} <EyeIcon />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mobile Vertical Fallback Card
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-solid border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md flex flex-col justify-between shadow-lg select-none">
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-950">
        <img
          src={project.coverImage}
          alt={project.title}
          className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
          draggable={false}
        />
        <div className="absolute inset-0 bg-slate-950/20 dark:bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      <div className="p-6 md:p-8 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {project.completedAt}
            </span>
            {project.featured && (
              <span className="text-[9px] font-extrabold font-mono text-blue-600 dark:text-blue-400 uppercase tracking-widest border border-solid border-blue-600/30 dark:border-blue-400/30 bg-blue-500/5 px-2 py-0.5 rounded-full">
                {t('project.featured')}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {project.title}
          </h3>
          <p className="mt-3 text-sm xl:text-base text-slate-650 dark:text-slate-350 leading-relaxed font-light">
            {project.description}
          </p>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-1.5 mb-5">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-semibold font-mono text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 px-2 py-1 rounded-md">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <a href={project.githubUrl} target="_blank" rel="noreferrer" className={`${linkClass} text-xs`}>
              {t('project.code')} <ExternalLinkIcon />
            </a>
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className={`${linkClass} text-xs`}>
                {t('project.live_demo')} <EyeIcon />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
