'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  const { postSlug } = useParams()

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = (scrollTop / docHeight) * 100
      setProgress(scrolled >= 90 ? 100 : scrolled < 10 ? 0 : scrolled)
    }

    if (postSlug) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    } else {
      setProgress(0)
    }
  }, [postSlug])

  return (
    <div
      className="bottom-[-10px] left-0 h-[1.5px] w-full transition-all duration-300 ease-in-out"
      style={{ backdropFilter: 'blur(6px)', zIndex: 100 }}
    >
      <div
        className="h-[1.5px] bg-gradient-to-r from-primary via-secondary to-base-500 transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 1.2}%` }}
      />
    </div>
  )
}
