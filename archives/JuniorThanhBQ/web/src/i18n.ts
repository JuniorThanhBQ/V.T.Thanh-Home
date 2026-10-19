import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from './messages/en.json'
import viTranslations from './messages/vi.json'

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslations,
      vi: viTranslations,
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng)
  }
})

export default i18n
