import { useEffect, useRef, useState } from 'react'
import { KnowledgeGraphNode } from '@/types/content/BlogTypes'
import { useGraphCanvas } from './useGraphCanvas'

type Link = { source: string; target: string }

type TooltipState = {
  visible: boolean
  x: number
  y: number
  title: string
  image?: string
}

function detectTheme(setTheme: (t: 'dark' | 'light') => void) {
  const checkTheme = () => {
    const html = document.documentElement
    const isDark =
      html.classList.contains('dark') ||
      html.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(isDark ? 'dark' : 'light')
  }

  checkTheme()
  const observer = new MutationObserver(checkTheme)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  })
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', checkTheme)

  return () => {
    observer.disconnect()
    mediaQuery.removeEventListener('change', checkTheme)
  }
}

export default function KnowledgeGraphCanvas({ categorySlug }: { categorySlug?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, title: '' })
  const [graphData, setGraphData] = useState<{ nodes: KnowledgeGraphNode[]; links: Link[] }>({
    nodes: [],
    links: [],
  })

  useEffect(() => detectTheme(setTheme), [])

  useEffect(() => {
    const url = categorySlug
      ? `/api/knowledge-graph?categorySlug=${categorySlug}`
      : '/api/knowledge-graph'

    fetch(url)
      .then((res) => res.json())
      .then((data) => setGraphData(data))
      .catch((err) => console.error('Failed to fetch graph data:', err))
  }, [categorySlug])

  useGraphCanvas(canvasRef, graphData, theme, setTooltip)

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" style={{ minHeight: 600 }} />
      {tooltip.visible && (
        <div
          className="absolute z-50 pointer-events-none px-3 py-2 rounded-lg shadow-lg text-sm font-medium max-w-xs"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
          }}
        >
          {tooltip.image && (
            <img src={tooltip.image} alt={tooltip.title || 'Knowledge graph node'} className="w-full mb-2 rounded" />
          )}
          <div>{tooltip.title}</div>
        </div>
      )}
    </div>
  )
}
