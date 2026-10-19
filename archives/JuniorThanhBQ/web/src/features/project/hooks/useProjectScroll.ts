import { useRef, useState } from 'react'
import { useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion'

interface UseProjectScrollReturn {
  outerRef: React.RefObject<HTMLDivElement | null>
  x: MotionValue<string>
  imageX: MotionValue<string>
  activeIndex: number
}

export function useProjectScroll(numCards: number): UseProjectScrollReturn {
  const outerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end']
  })

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ['0vw', `${-(numCards - 1) * 100}vw`]
  )

  const imageX = useTransform(
    scrollYProgress,
    [0, 1],
    ['8%', '-8%']
  )

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActiveIndex(Math.round(v * (numCards - 1)))
  })

  return { outerRef, x, imageX, activeIndex }
}
