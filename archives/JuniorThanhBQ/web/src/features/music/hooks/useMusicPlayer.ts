import { useState, useCallback } from 'react'
import { extractYouTubeVideoId } from '../utils/youtube'

export function useMusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>('jfKfPfyJRdk')
  const [inputUrl, setInputUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const openPlayer = useCallback(() => {
    setIsOpen(true)
    setIsMinimized(false)
  }, [])

  const closePlayer = useCallback(() => {
    setIsOpen(false)
    setIsMinimized(false)
  }, [])

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev)
  }, [])

  const loadVideo = useCallback((urlToLoad?: string) => {
    const target = urlToLoad ?? inputUrl
    if (!target.trim()) {
      setError('Please provide a valid YouTube URL or video ID.')
      return false
    }

    const extractedId = extractYouTubeVideoId(target)
    if (!extractedId) {
      setError('Invalid YouTube link. Please paste a valid YouTube URL or iframe.')
      return false
    }

    setCurrentVideoId(extractedId)
    setError(null)
    setInputUrl('')
    return true
  }, [inputUrl])

  return {
    isOpen,
    isMinimized,
    currentVideoId,
    inputUrl,
    error,
    setInputUrl,
    openPlayer,
    closePlayer,
    toggleMinimize,
    loadVideo,
  }
}
