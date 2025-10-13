'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = (scrollTop / docHeight) * 100 
      setProgress(scrolled >= 99 ? 100 : scrolled)

    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 z-100 h-[3px] w-full bg-gray-200 dark:bg-gray-700"
      style={{ backdropFilter: 'blur(6px)' , zIndex: 1000}}
    >
      <div
        className="h-[3px] bg-gradient-to-r from-primary via-secondary to-base-500 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
