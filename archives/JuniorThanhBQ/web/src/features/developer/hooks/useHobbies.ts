import { useTranslation } from 'react-i18next'
import { useScroll, useTransform } from 'framer-motion'
import { useLenis } from 'lenis/react'

export function useHobbies(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { t } = useTranslation()
  const lenis = useLenis()

  const hobbiesItems = [
    {
      title: t('developer.hobby_subculture'),
      desc: t('developer.hobby_subculture_desc'),
      gif: 'https://media.tenor.com/7H9RgXfWIsgAAAAM/subaru.gif',
      type: 'subculture'
    },
    {
      title: t('developer.hobby_ai'),
      desc: t('developer.hobby_ai_desc'),
      quote: t('home.quote'),
      type: 'ai'
    },
    {
      title: t('developer.hobby_learning'),
      desc: t('developer.hobby_learning_desc'),
      icon: '🎶',
      type: 'learning'
    }
  ]

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  const scrollRanges = [
    [0, 0.25],
    [0.25, 0.60],
    [0.60, 1.0]
  ]

  const indicatorOpacity0 = useTransform(scrollYProgress, scrollRanges[0], [0.2, 1])
  const indicatorOpacity1 = useTransform(scrollYProgress, scrollRanges[1], [0.2, 1])
  const indicatorOpacity2 = useTransform(scrollYProgress, scrollRanges[2], [0.2, 1])

  const indicatorScale0 = useTransform(scrollYProgress, scrollRanges[0], [0.9, 1.15])
  const indicatorScale1 = useTransform(scrollYProgress, scrollRanges[1], [0.9, 1.15])
  const indicatorScale2 = useTransform(scrollYProgress, scrollRanges[2], [0.9, 1.15])

  const indicatorOpacities = [indicatorOpacity0, indicatorOpacity1, indicatorOpacity2]
  const indicatorScales = [indicatorScale0, indicatorScale1, indicatorScale2]

  const cardY0 = useTransform(scrollYProgress, scrollRanges[0], [100, 0])
  const cardOpacity0 = useTransform(scrollYProgress, [0, 0.25, 0.30], [1, 1, 0])
  const cardScale0 = useTransform(scrollYProgress, [0, 0.25, 0.30], [1, 1, 0.95])

  const cardY1 = useTransform(scrollYProgress, scrollRanges[1], [100, 0])
  const cardOpacity1 = useTransform(scrollYProgress, [0.20, 0.25, 0.60, 0.65], [0, 1, 1, 0])
  const cardScale1 = useTransform(scrollYProgress, [0.20, 0.25, 0.60, 0.65], [0.95, 1, 1, 0.95])

  const cardY2 = useTransform(scrollYProgress, scrollRanges[2], [100, 0])
  const cardOpacity2 = useTransform(scrollYProgress, [0.55, 0.60, 1.0], [0, 1, 1])
  const cardScale2 = useTransform(scrollYProgress, [0.55, 0.60, 1.0], [0.95, 1, 1])

  const cardYs = [cardY0, cardY1, cardY2]
  const cardOpacities = [cardOpacity0, cardOpacity1, cardOpacity2]
  const cardScales = [cardScale0, cardScale1, cardScale2]


  const scrollToCard = (index: number) => {
    if (!containerRef.current || !lenis) return

    const rect = containerRef.current.getBoundingClientRect()
    const scrollTop = window.scrollY + rect.top
    const scrollHeight = containerRef.current.scrollHeight
    const scrollRange = scrollHeight - window.innerHeight

    const centers = [0.125, 0.425, 0.80]
    const targetScrollY = scrollTop + centers[index] * scrollRange

    lenis.scrollTo(targetScrollY, {
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    })
  }

  return {
    t,
    hobbiesItems,
    indicatorOpacities,
    indicatorScales,
    cardYs,
    cardOpacities,
    cardScales,
    scrollToCard
  }
}
