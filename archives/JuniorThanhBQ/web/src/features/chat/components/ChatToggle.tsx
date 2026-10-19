import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Music, X } from 'lucide-react'

interface ChatToggleProps {
  isOpen: boolean
  onClick: () => void
  onMusicClick?: () => void
}

export function ChatToggle({ isOpen, onClick, onMusicClick }: ChatToggleProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mouseAngle, setMouseAngle] = useState(-135)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const [isGalleryOpen, setIsGalleryOpen] = useState(() => {
    return typeof document !== 'undefined' && document.body.classList.contains('gallery-open')
  })

  useEffect(() => {
    const handleGalleryToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>
      setIsGalleryOpen(Boolean(customEvent.detail?.isOpen))
    }

    window.addEventListener('gallery-modal-toggle', handleGalleryToggle)
    return () => window.removeEventListener('gallery-modal-toggle', handleGalleryToggle)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const radians = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const degrees = (radians * 180) / Math.PI
      setMouseAngle(degrees)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('pointerdown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [isMenuOpen])

  if (isOpen || isGalleryOpen) return null

  const handleMainClick = () => {
    if (isMobile) {
      onClick()
      return
    }
    setIsMenuOpen(prev => !prev)
  }

  const handleChatSelect = () => {
    setIsMenuOpen(false)
    onClick()
  }

  const handleMusicSelect = () => {
    setIsMenuOpen(false)
    if (onMusicClick) {
      onMusicClick()
    }
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-[90]">
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
              animate={{ scale: 1, x: -76, y: -16, opacity: 1 }}
              exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleChatSelect}
              className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-xl flex items-center justify-center cursor-pointer border border-blue-400/30 focus:outline-none group"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-mono font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md whitespace-nowrap">
                Chatbot
              </span>
            </motion.button>

            {!isMobile && (
              <motion.button
                type="button"
                initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                animate={{ scale: 1, x: -16, y: -76, opacity: 1 }}
                exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28, delay: 0.03 }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMusicSelect}
                className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white shadow-xl flex items-center justify-center cursor-pointer border border-indigo-400/30 focus:outline-none group"
              >
                <Music className="w-5 h-5" />
                <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-mono font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md whitespace-nowrap">
                  Music
                </span>
              </motion.button>
            )}
          </>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={handleMainClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xl cursor-pointer focus:outline-none border border-slate-700/60 dark:border-slate-300"
      >
        <AnimatePresence mode="wait">
          {isMenuOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : isHovered ? (
            <motion.div
              key="four-squares"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="grid grid-cols-2 gap-1.5"
            >
              <div className="w-2 h-2 rounded-[2px] bg-white dark:bg-slate-950" />
              <div className="w-2 h-2 rounded-[2px] bg-white dark:bg-slate-950" />
              <div className="w-2 h-2 rounded-[2px] bg-white dark:bg-slate-950" />
              <div className="w-2 h-2 rounded-[2px] bg-white dark:bg-slate-950" />
            </motion.div>
          ) : (
            <motion.div
              key="tracking-triangle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, rotate: mouseAngle }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                rotate: { type: 'spring', stiffness: 350, damping: 25 },
                opacity: { duration: 0.15 },
                scale: { duration: 0.15 }
              }}
              className="flex items-center justify-center w-6 h-6"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white dark:fill-slate-950">
                <polygon points="21,12 4,3 7,12 4,21" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
