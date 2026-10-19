import { useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { AVATAR_URLS } from '../../../assets/cloudinary_url'

interface AvatarGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  avatarUrl: string
}

export function AvatarGalleryModal({ isOpen, onClose, avatarUrl }: AvatarGalleryModalProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scale, setScale] = useState(1)

  const items = [
    {
      url: AVATAR_URLS.cv_picture_one,
      title: t('home.gallery.pic1_title'),
      summary: t('home.gallery.pic1_summary'),
    },
    {
      url: AVATAR_URLS.cv_picture_two,
      title: t('home.gallery.pic2_title'),
      summary: t('home.gallery.pic2_summary'),
    },
  ]

  const resetZoom = useCallback(() => {
    setScale(1)
  }, [])

  const zoomIn = () => {
    setScale((prev) => Math.min(Number((prev + 0.5).toFixed(2)), 3))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(Number((prev - 0.5).toFixed(2)), 1))
  }

  const handlePrev = useCallback(() => {
    resetZoom()
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
  }, [items.length, resetZoom])

  const handleNext = useCallback(() => {
    resetZoom()
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
  }, [items.length, resetZoom])

  const handleClose = useCallback(() => {
    setCurrentIndex(0)
    resetZoom()
    onClose()
  }, [onClose, resetZoom])

  useEffect(() => {
    if (!isOpen) return

    document.body.classList.add('gallery-open')
    const prevOverflow = document.body.style.overflow
    const prevTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    window.dispatchEvent(new CustomEvent('gallery-modal-toggle', { detail: { isOpen: true } }))

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('gallery-open')
      document.body.style.overflow = prevOverflow
      document.body.style.touchAction = prevTouchAction
      window.dispatchEvent(new CustomEvent('gallery-modal-toggle', { detail: { isOpen: false } }))
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleNext, handlePrev])

  const currentItem = items[currentIndex]

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[96vw] max-w-6xl h-[90vh] md:h-auto max-h-[94vh] rounded-3xl border border-slate-200/40 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row outline-none animate-in fade-in zoom-in-95 duration-200">

          <div className="w-full flex-1 md:flex-initial md:w-[70%] bg-slate-950 flex flex-col items-center justify-center relative min-h-0 md:min-h-[620px] p-3 md:p-6 select-none overflow-hidden group">
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md text-white shadow-xl">
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= 1}
                className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-semibold px-1 text-slate-300 min-w-[3.2rem] text-center select-none">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= 3}
                className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {scale > 1 && (
                <button
                  type="button"
                  onClick={resetZoom}
                  className="p-1.5 rounded-full hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-all ml-0.5 cursor-pointer"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none"
            >
              <motion.div
                key={currentItem.url}
                className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
                drag={true}
                dragPropagation={false}
                dragConstraints={
                  scale > 1
                    ? {
                        left: -350 * (scale - 1),
                        right: 350 * (scale - 1),
                        top: -300 * (scale - 1),
                        bottom: 300 * (scale - 1),
                      }
                    : {
                        left: -150,
                        right: 150,
                        top: -120,
                        bottom: 120,
                      }
                }
                dragElastic={0.2}
                animate={{ scale }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                <img
                  src={currentItem.url}
                  alt={currentItem.title}
                  draggable={false}
                  className="max-h-[85%] md:max-h-[580px] w-full object-contain rounded-2xl drop-shadow-2xl select-none pointer-events-none"
                />
              </motion.div>
            </div>

            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/70 hover:bg-blue-600 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95 hover:scale-105 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/70 hover:bg-blue-600 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95 hover:scale-105 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/75 border border-white/10 backdrop-blur-md shadow-lg">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    resetZoom()
                    setCurrentIndex(idx)
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex ? 'w-6 bg-blue-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
              <span className="text-[11px] font-mono text-slate-300 ml-1">
                {currentIndex + 1}/{items.length}
              </span>
            </div>
          </div>

          <div className="w-full md:w-[30%] p-4 md:p-8 flex flex-col justify-start md:justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
            <div>
              <div className="flex items-center justify-between gap-3 md:mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl}
                    alt={t('name')}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-blue-500/40 bg-white dark:bg-slate-800 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {t('name')}
                    </h4>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 tracking-tight">
                      {t('home.gallery.role')}
                    </span>
                  </div>
                </div>

                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label={t('home.gallery.close')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="hidden md:block h-px w-full bg-gradient-to-r from-blue-500/20 via-slate-200 dark:via-slate-800 to-transparent mb-6" />

              <div className="hidden md:flex flex-col gap-3">
                <Dialog.Title className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug text-justify">
                  {currentItem.title}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-1 text-justify">
                  {currentItem.summary}
                </Dialog.Description>
              </div>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
