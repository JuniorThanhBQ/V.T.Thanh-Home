import { useTranslation } from 'react-i18next'
import { useProjects } from '../hooks/useProjects'
import { ProjectGrid } from '../components/ProjectGrid'

export function ProjectPage() {
  const { t } = useTranslation()
  const { projects, loading, error } = useProjects()

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {loading ? (
        <div className="flex justify-center items-center h-screen relative z-10">
          <div className="w-8 h-8 rounded-full border-2 border-solid border-slate-200 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-screen px-6 relative z-10">
          <div className="text-center max-w-md py-10 px-8 rounded-3xl border border-solid border-rose-500/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-xl">
            <p className="text-rose-500 font-mono text-sm font-semibold mb-2">{t('project.error_title')}</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs">{error}</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex justify-center items-center h-screen text-slate-400 dark:text-slate-500 font-mono text-sm">
          {t('project.empty')}
        </div>
      ) : (
        <ProjectGrid projects={projects} />
      )}
    </div>
  )
}
