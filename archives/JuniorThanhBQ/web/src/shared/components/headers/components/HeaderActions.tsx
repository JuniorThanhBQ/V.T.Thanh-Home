import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { useHeader } from '../hooks/useHeader'

type HeaderActionsProps = {
  isMobile?: boolean
}

export function HeaderActions({ isMobile = false }: HeaderActionsProps) {
  const { i18n, changeLanguage, toggleTheme, theme } = useHeader()

  const containerClass = isMobile
    ? "flex flex-col gap-4 items-center w-full mt-4"
    : "hidden md:flex justify-end items-center gap-4 w-full"

  const isVi = i18n.language === 'vi'

  return (
    <div className={containerClass}>
      <div className={`relative inline-flex items-center p-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-md self-center ${isMobile ? 'w-full justify-center' : ''}`}>
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          className={`relative z-10 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors duration-200 cursor-pointer ${
            !isVi
              ? 'text-white dark:text-slate-950'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {!isVi && (
            <motion.div
              layoutId="active-lang-indicator"
              className="absolute inset-0 bg-slate-900 dark:bg-white rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          English
        </button>

        <div className="w-[1.5px] h-4/5 self-center rotate-[20deg] bg-slate-300 dark:bg-slate-700 mx-1 shrink-0 rounded-full" />

        <button
          type="button"
          onClick={() => changeLanguage('vi')}
          className={`relative z-10 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors duration-200 cursor-pointer ${
            isVi
              ? 'text-white dark:text-slate-950'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isVi && (
            <motion.div
              layoutId="active-lang-indicator"
              className="absolute inset-0 bg-slate-900 dark:bg-white rounded-xl shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          Vietnamese
        </button>
      </div>

      <Button
        variant="ghost"
        onClick={toggleTheme}
        className={`rounded-full border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-all duration-300 shadow-sm ${isMobile ? 'flex justify-center items-center gap-3 px-4 w-full h-10 text-slate-900 dark:text-white' : 'w-10 h-10 flex justify-center items-center p-0'}`}
      >
        <div className="relative h-5 w-5 flex items-center justify-center shrink-0">
          <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-transform duration-500 dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform duration-500 dark:rotate-0 dark:scale-100 text-blue-400" />
        </div>
        {isMobile && <span className="font-semibold">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
      </Button>
    </div>
  )
}
