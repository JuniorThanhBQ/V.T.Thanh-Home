import { useState, useCallback, useEffect, useRef } from 'react'

const DEFAULT_WIDTH = 450
const MIN_WIDTH = 320

export function useChatResize(isOpen: boolean) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const draggingRef = useRef(false)
  const prevIsOpenRef = useRef(isOpen)

  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      const timer = setTimeout(() => {
        setWidth(DEFAULT_WIDTH)
      }, 0)
      return () => clearTimeout(timer)
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    draggingRef.current = true
    setIsDragging(true)

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!draggingRef.current) return
      const maxWidth = window.innerWidth * 0.5
      const newWidth = window.innerWidth - moveEvent.clientX
      setWidth(Math.min(maxWidth, Math.max(MIN_WIDTH, newWidth)))
    }

    const onPointerUp = () => {
      draggingRef.current = false
      setIsDragging(false)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }, [])

  return { width, isDragging, onPointerDown }
}
