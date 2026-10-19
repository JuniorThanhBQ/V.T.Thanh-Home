import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type LoadingContextType = {
  isLoading: boolean
  loadingMessage: string
  startLoading: (message?: string) => void
  stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const startLoading = useCallback((message = '') => {
    setLoadingMessage(message)
    setIsLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  const value = useMemo(
    () => ({ isLoading, loadingMessage, startLoading, stopLoading }),
    [isLoading, loadingMessage, startLoading, stopLoading]
  )

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
