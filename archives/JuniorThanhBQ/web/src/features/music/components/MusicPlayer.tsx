import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  X,
  Minus,
  Maximize2,
  Play,
  GripHorizontal,
  ExternalLink,
  AlertCircle,
  Radio,
} from 'lucide-react'
import { buildSafeYouTubeEmbedUrl } from '../utils/youtube'

interface MusicPlayerProps {
  isOpen: boolean
  isMinimized: boolean
  currentVideoId: string | null
  inputUrl: string
  error: string | null
  setInputUrl: (val: string) => void
  onClose: () => void
  onToggleMinimize: () => void
  onLoadVideo: (url?: string) => boolean
}

export function MusicPlayer({
  isOpen,
  isMinimized,
  currentVideoId,
  inputUrl,
  error,
  setInputUrl,
  onClose,
  onToggleMinimize,
  onLoadVideo,
}: MusicPlayerProps) {
  const { t } = useTranslation()
  const [isMobile, setIsMobile] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isOpen || isMobile) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLoadVideo()
  }

  return (
    <>
      <div
        ref={constraintsRef}
        className="fixed left-4 right-4 bottom-4 top-20 lg:top-24 pointer-events-none z-[95]"
      />

      <motion.div
        drag
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={constraintsRef}
        dragElastic={0}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="fixed bottom-24 right-8 z-[96] pointer-events-auto"
      >
        <div
          className={`relative rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/25 shadow-2xl shadow-slate-400/20 dark:shadow-slate-950/80 text-slate-800 dark:text-white overflow-hidden transition-[width] duration-200 ${
            isMinimized ? 'w-80' : 'w-[480px] sm:w-[560px]'
          }`}
        >
          <div
            onPointerDown={e => dragControls.start(e)}
            className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-blue-500/20 select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-100">
                {t('music.title')}
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <GripHorizontal className="w-4 h-4 text-slate-400 dark:text-slate-500 opacity-60 hover:opacity-100 transition-opacity" />
              <button
                type="button"
                onClick={onToggleMinimize}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200 transition-colors focus:outline-none"
                title={isMinimized ? t('music.expand') : t('music.minimize')}
              >
                {isMinimized ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-slate-500 hover:bg-red-500/10 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors focus:outline-none"
                title={t('music.close')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className={isMinimized ? 'hidden' : 'p-3.5 space-y-3'}>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  placeholder={t('music.placeholder')}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/70 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer focus:outline-none"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </form>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 dark:bg-red-950/50 border border-red-500/30 text-red-600 dark:text-red-300 text-[11px]"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/90 border border-slate-200 dark:border-slate-800 shadow-inner">
              {currentVideoId ? (
                <iframe
                  src={buildSafeYouTubeEmbedUrl(currentVideoId)}
                  title="YouTube media player"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center text-slate-400">
                  <Radio className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-2 opacity-80" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {t('music.empty_title')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('music.empty_desc')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {isMinimized && (
            <div className="px-3.5 py-2.5 flex items-center justify-between text-xs bg-slate-100/90 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800/50">
              <div className="flex items-center gap-2 truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                <span className="text-slate-600 dark:text-slate-300 truncate text-[11px]">
                  {t('music.playing_bg')}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleMinimize}
                className="text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
              >
                {t('music.restore')}
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
