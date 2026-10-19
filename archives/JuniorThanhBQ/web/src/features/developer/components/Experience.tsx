import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Hand } from 'lucide-react'
import { useDeveloper } from '../hooks/useDeveloper'

export function Experience() {
  const { t, filteredSkills, categories, activeCategory, setActiveCategory } = useDeveloper()
  const containerRef = useRef<HTMLDivElement>(null)
  const [resetKey, setResetKey] = useState(0)

  const handleCategoryChange = (catId: typeof activeCategory) => {
    setActiveCategory(catId)
    setResetKey(k => k + 1)
  }

  const handleReset = () => {
    setResetKey(k => k + 1)
  }

  return (
    <section id="experience" className="w-full py-16 md:py-24 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <span className="text-base font-bold font-mono tracking-widest text-blue-600 dark:text-blue-400 uppercase">
            {t('developer.experience_title')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black mt-3 tracking-tight">
            {t('developer.experience_sub')}
          </h2>
          <p className="text-xs md:text-sm font-medium font-mono text-slate-400 dark:text-slate-500 max-w-xl mx-auto mt-4 leading-relaxed uppercase tracking-wider">
            {t('developer.skills_disclaimer')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold font-mono tracking-wider uppercase transition-all duration-300 border focus:outline-none cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between max-w-5xl mx-auto px-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 dark:text-slate-500 select-none">
            <Hand className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>{t('developer.drag_hint')}</span>
          </div>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-300 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:border-blue-700 transition-all cursor-pointer bg-white/60 dark:bg-slate-900/60 shadow-xs active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('developer.reset_positions')}</span>
          </button>
        </div>

        <div ref={containerRef} className="relative min-h-[360px] p-6 sm:p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/30 overflow-hidden">
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredSkills.map(skill => (
                <motion.div
                  layout
                  drag
                  dragConstraints={containerRef}
                  dragElastic={0.08}
                  dragTransition={{
                    power: 0.08,
                    timeConstant: 250,
                    bounceStiffness: 250,
                    bounceDamping: 35
                  }}
                  whileHover={{ scale: 1.04, cursor: 'grab' }}
                  whileDrag={{
                    scale: 1.1,
                    zIndex: 50,
                    cursor: 'grabbing',
                    rotate: 2,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={`${skill.name}-${resetKey}`}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${skill.color} select-none shadow-sm touch-none`}
                >
                  <span className="text-sm md:text-base font-extrabold tracking-tight pointer-events-none">
                    {skill.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

      </div>
    </section>
  )
}
