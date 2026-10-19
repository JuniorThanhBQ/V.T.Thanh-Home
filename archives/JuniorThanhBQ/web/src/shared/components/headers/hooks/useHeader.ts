import { useTranslation } from 'react-i18next'
import { useTheme } from '../../../../contexts/theme-provider'
import { useLoading } from '../../../../contexts/loading-provider'
import { AVATAR_URLS } from '../../../../assets/cloudinary_url'

export function useHeader() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { startLoading, stopLoading } = useLoading()

  const changeLanguage = (lang: string) => {
    if (i18n.language === lang) return
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
    startLoading()
    i18n.changeLanguage(lang)
    setTimeout(() => {
      stopLoading()
    }, 500)
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const avatarUrl = theme === 'dark' ? AVATAR_URLS.dark : AVATAR_URLS.light

  return {
    t,
    i18n,
    theme,
    toggleTheme,
    changeLanguage,
    avatarUrl,
  }
}
