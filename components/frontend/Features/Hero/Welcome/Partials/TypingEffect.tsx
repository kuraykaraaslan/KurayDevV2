'use client'
import i18n from '@/libs/localize/localize'
import { useState, useEffect, useMemo } from 'react'

const TypingEffect = () => {
  const { t } = i18n

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const texts = useMemo(
    () => [
      t('pages.welcome.typingEffect.text1'),
      t('pages.welcome.typingEffect.text2'),
      t('pages.welcome.typingEffect.text3'),
      t('pages.welcome.typingEffect.text4'),
      t('pages.welcome.typingEffect.text5'),
      t('pages.welcome.typingEffect.text6'),
    ],
    [i18n.language]
  )

  const [textsIndex, setTextsIndex] = useState(0)
  const [letterIndex, setLetterIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pause, setPause] = useState(false)
  const [renderedText, setRenderedText] = useState('')

  useEffect(() => {
    if (prefersReducedMotion) return // skip animation entirely

    const current = texts[textsIndex]
    const delay = isDeleting ? 30 : 80
    const pauseAfterFull = 1000
    const pauseAfterDelete = 300

    const handleTyping = () => {
      if (pause) return
      if (!isDeleting && letterIndex < current.length) {
        setLetterIndex((i) => i + 1)
      } else if (isDeleting && letterIndex > 0) {
        setLetterIndex((i) => i - 1)
      } else if (!isDeleting && letterIndex === current.length) {
        setTimeout(() => setIsDeleting(true), pauseAfterFull)
      } else if (isDeleting && letterIndex === 0) {
        setIsDeleting(false)
        setTextsIndex((i) => (i + 1) % texts.length)
        setTimeout(() => {}, pauseAfterDelete)
      }
    }

    const timeout = setTimeout(handleTyping, delay)
    setRenderedText(current.substring(0, letterIndex))
    return () => clearTimeout(timeout)
  }, [letterIndex, isDeleting, pause, textsIndex, texts, prefersReducedMotion])

  // Reduced motion: show first text statically
  if (prefersReducedMotion) {
    return (
      <span className="text-3xl font-bold text-shadow-sm pb-2">
        {t('pages.welcome.typingEffect.prefix')}&nbsp;
        <span className="text-primary text-shadow-sm">{texts[0]}</span>
        &nbsp;
        {t('pages.welcome.typingEffect.suffix')}
      </span>
    )
  }

  return (
    <span className="text-3xl font-bold text-shadow-sm pb-2">
      {t('pages.welcome.typingEffect.prefix')}&nbsp;
      <span
        className="text-primary text-shadow-sm"
        onMouseEnter={() => setPause(true)}
        onMouseLeave={() => setPause(false)}
      >
        {renderedText === '' ? ' ' : renderedText}
      </span>
      &nbsp;
      {t('pages.welcome.typingEffect.suffix')}
    </span>
  )
}

export default TypingEffect
