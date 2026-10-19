import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { useHome } from '../hooks/useHome'
import { AVATAR_URLS } from '../../../assets/cloudinary_url'
import { AvatarGalleryModal } from './AvatarGalleryModal'

export function Hero() {
  const { t, avatarUrl } = useHome()
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const contacts = [
    { iconUrl: AVATAR_URLS.ouhcmc, text: t('home.ouhcmc'), href: "https://it.ou.edu.vn" },
    { iconUrl: AVATAR_URLS.github, text: t('home.github'), href: "https://github.com/JuniorThanhBQ/" },
    { iconUrl: AVATAR_URLS.linkedin, text: t('home.linkedin'), href: "https://www.linkedin.com/in/juniorthanh09/" },
    { iconUrl: AVATAR_URLS.gmail, text: t('home.gmail'), href: "/contact" }
  ]

  return (
    <section className="w-full mesh-bg text-slate-900 dark:text-white border-b border-blue-200/50 dark:border-slate-800/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col-reverse md:flex-row items-center justify-between gap-12 z-10 relative">
        <div className="w-full md:w-[60%] flex flex-col gap-6 text-left">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-300 bg-blue-100/10 hover:bg-blue-100/20 text-blue-700 dark:border-slate-700 dark:bg-slate-800/25 dark:hover:bg-slate-800/40 dark:text-blue-300 w-fit text-sm font-semibold tracking-wide transition-colors duration-300">
            {t('home.welcome')}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            {t('home.title_1')}{' '}
            <span className="text-blue-700 dark:text-blue-400">{t('home.title_highlight')}</span>
          </h1>

          <p className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed max-w-2xl font-normal text-justify">
            {t('home.bio')}
          </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {contacts.map((contact, index) => {
            return (
              <a
                key={index}
                href={contact.href}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl border border-blue-200 bg-white/40 hover:shadow-md hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/35 dark:hover:border-slate-700 transition-all duration-300 active:scale-[0.98]"
              >
                <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 shrink-0">
                  <img src={contact.iconUrl} alt={contact.text} className="h-6 w-6 object-contain" />
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {contact.text}
                </span>
              </a>
            )
          })}
        </div>

        <div className="mt-8 p-6 rounded-2xl border-l-4 border-blue-500 bg-white/30 border-y border-r border-blue-200/50 dark:bg-slate-950/40 dark:border-slate-800/50 max-w-2xl">
          <p className="text-sm italic font-medium text-slate-800 dark:text-slate-200 font-mono">
            "{t('home.quote')}"
          </p>
          <span className="block mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
            {t('home.quote_author')}
          </span>
        </div>
      </div>

      <div className="w-full md:w-[40%] flex justify-center items-center">
        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="relative group max-w-[320px] md:max-w-full cursor-pointer text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 rounded-full"
          aria-label={t('home.gallery.view_gallery')}
        >
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 opacity-20 blur-xl group-hover:opacity-45 transition duration-500"></div>
          <img
            src={avatarUrl}
            alt="Avatar"
            className="relative h-64 w-64 md:h-96 md:w-96 object-cover rounded-full border border-white/20 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl group-hover:scale-102 transition-all duration-500"
          />
          <div className="absolute inset-0 rounded-full bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
            <div className="p-3 rounded-full bg-blue-600/90 shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300">
              <Maximize2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider font-mono bg-slate-950/80 px-3.5 py-1 rounded-full border border-white/20 shadow-md">
              {t('home.gallery.view_gallery')}
            </span>
          </div>
        </button>
      </div>
      </div>

      <AvatarGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        avatarUrl={avatarUrl}
      />
    </section>
  )
}
