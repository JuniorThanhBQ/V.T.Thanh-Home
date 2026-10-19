import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, User, X } from 'lucide-react'
import type { Message } from '../hooks/useChat'
import { useTheme } from '../../../contexts/theme-provider'
import { AVATAR_URLS } from '../../../assets/cloudinary_url'
import { FluidShader } from '../../developer/components/FluidShader'
import { MarkdownRenderer } from '../../../shared/utils/markdown'
import { useChatResize } from '../hooks/useChatResize'

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
  inputText: string
  setInputText: (text: string) => void
  isTyping: boolean
  onSendMessage: (text: string) => void
}

export function ChatSidebar({
  isOpen,
  onClose,
  messages,
  inputText,
  setInputText,
  isTyping,
  onSendMessage
}: ChatSidebarProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const { theme } = useTheme()
  const activeTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  const botIconUrl = activeTheme === 'dark' ? AVATAR_URLS.dark : AVATAR_URLS.light
  const { width, isDragging, onPointerDown } = useChatResize(isOpen)

  const suggestionPills = [
    t('chat.pill_tech'),
    t('chat.pill_projects'),
    t('chat.pill_contact')
  ]

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      onSendMessage(inputText)
    }
  }

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

  return (
    <AnimatePresence>
      {isOpen && !isGalleryOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-[2px] z-[70]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ width: '100%', maxWidth: width, userSelect: isDragging ? 'none' : undefined }}
            className="fixed top-0 right-0 h-full bg-transparent border-l border-solid border-slate-100 dark:border-slate-800 shadow-2xl z-[80] flex flex-col overflow-hidden max-w-full"
          >
            <div
              onPointerDown={onPointerDown}
              className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400/40 dark:hover:bg-blue-500/30 active:bg-blue-500/50 transition-colors z-20 select-none"
            />
            <FluidShader />
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-solid border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-white-900 dark:bg-slate-950">
                  <img src={botIconUrl} alt="Chatbot Icon" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    {t('chat.title')}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                      {t('chat.status_active')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot'
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-[85%] ${
                      isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                        isBot
                          ? 'bg-slate-50 dark:bg-slate-800'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-450'
                      }`}
                    >
                      {isBot ? (
                        <img src={botIconUrl} alt="Bot" className="w-6 h-6 object-contain" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed border-0 ${
                          isBot
                            ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-850 dark:text-slate-200 rounded-tl-sm'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-md shadow-blue-500/10'
                        }`}
                      >
                        {isBot ? <MarkdownRenderer content={t(msg.text)} /> : msg.text}
                      </div>
                      <div
                        className={`text-[9px] font-semibold text-slate-400 dark:text-slate-500 font-mono ${
                          isBot ? 'text-left' : 'text-right'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                )
              })}

              {isTyping && (
                <div className="flex items-start gap-3 max-w-[85%] mr-auto">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 shrink-0">
                    <img src={botIconUrl} alt="Bot" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                  </div>
                </div>
              )}

              {messages.length === 1 && !isTyping && (
                <div className="space-y-2 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                    {t('chat.suggested_topics')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {suggestionPills.map((pill, i) => (
                      <button
                        key={i}
                        onClick={() => onSendMessage(pill)}
                        className="w-full text-left px-4 py-2.5 rounded-xl border border-solid border-slate-100 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-xs text-slate-650 dark:text-slate-300 font-mono transition-all hover:border-blue-500 dark:hover:border-blue-400 hover:scale-[1.01] cursor-pointer"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-5 border-t border-solid border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex gap-2 items-center relative z-10"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('chat.input_placeholder')}
                className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-solid border-slate-150 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 font-mono transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white disabled:opacity-40 disabled:hover:bg-blue-600 disabled:dark:hover:bg-blue-500 transition-colors border-0 cursor-pointer shadow-md shadow-blue-500/10 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="px-4 sm:px-6 py-3 pb-5 sm:pb-3 text-center text-[10px] text-slate-400 dark:text-slate-600 font-mono leading-snug border-t border-solid border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md relative z-10 shrink-0">
              {t('chat.disclaimer')}
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
