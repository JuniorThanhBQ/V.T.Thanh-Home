import { motion, useScroll, useSpring } from 'framer-motion'

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <motion.div
      data-testid="reading-progress-bar"
      className="fixed top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 z-[100] origin-left shadow-[0_0_8px_rgba(56,189,248,0.5)]"
      style={{ scaleX }}
    />
  )
}
