import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { ProjectItem } from '../hooks/useProjects'
import { useProjectScroll } from '../hooks/useProjectScroll'
import { ProjectCard } from './ProjectCard'

interface ProjectGridProps {
  projects: ProjectItem[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const { t } = useTranslation()
  const totalSlides = projects.length + 1
  const { outerRef, x, imageX, activeIndex } = useProjectScroll(totalSlides)

  return (
    <>
      {/* Desktop Horizontal Scroll & Parallax */}
      <div
        ref={outerRef}
        className="hidden lg:block relative w-full"
        style={{ height: `${totalSlides * 100}vh` }}
      >
        <div className="sticky top-20 h-[calc(100vh-5rem)] w-full flex items-center overflow-hidden">
          <motion.div
            style={{ x }}
            className="flex h-full will-change-transform"
          >
            {/* Title / Intro Slide */}
            <div className="relative w-screen h-full flex-shrink-0 flex items-center justify-center bg-transparent px-16 xl:px-24">
              <div className="max-w-4xl w-full text-left select-none">
                <span className="text-xs font-bold font-mono tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                  {t('project.mobile_instruction')}
                </span>
                <h1 className="text-5xl xl:text-7xl font-black tracking-tight leading-none mt-3 text-slate-900 dark:text-white">
                  {t('project.title')}
                </h1>
                <p className="text-base xl:text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed max-w-2xl font-light">
                  {t('project.subtitle')}
                </p>
                <div className="mt-8 flex items-center gap-3 text-xs font-bold font-mono text-slate-400 dark:text-slate-600 uppercase tracking-widest animate-pulse">
                  <span>{t('project.scroll_instruction')}</span>
                  <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Project Slides */}
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index + 1}
                total={totalSlides}
                imageX={imageX}
              />
            ))}
          </motion.div>

          {/* Premium Bottom Bar (Progress + Fraction Indicator) */}
          <div className="absolute bottom-8 left-16 xl:left-24 right-16 xl:right-24 flex items-center justify-between z-20 select-none">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold font-mono text-slate-400 dark:text-slate-600">
                0{activeIndex + 1}
              </span>
              <div className="w-32 h-[1px] bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out"
                  style={{ width: `${((activeIndex + 1) / totalSlides) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold font-mono text-slate-400 dark:text-slate-600">
                0{totalSlides}
              </span>
            </div>
            <span className="text-[10px] font-bold font-mono tracking-widest text-slate-400 dark:text-slate-600 uppercase">
              {t('project.showcase_title')}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Vertical Stack Fallback */}
      <div className="lg:hidden w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-500 pb-16 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
          <header className="text-center pt-2 mb-2">
            <span className="text-[10px] font-bold font-mono tracking-widest text-blue-600 dark:text-blue-400 uppercase">
              {t('project.mobile_instruction')}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mt-1 mb-2">
              {t('project.title')}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
              {t('project.subtitle')}
            </p>
          </header>

          <div className="flex flex-col gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                total={projects.length}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
