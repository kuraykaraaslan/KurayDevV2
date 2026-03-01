import { useEffect, useRef } from 'react'
import {
  KnowledgeGraphNode,
  KnowledgeGraphLink,
  KnowledgeGraphNodePosition,
  KnowledgeGraphParticle,
  KnowledgeGraphTooltipState,
} from '@/types/content/BlogTypes'

type Link = KnowledgeGraphLink
type Node = KnowledgeGraphNodePosition
type Particle = KnowledgeGraphParticle
type TooltipState = KnowledgeGraphTooltipState

function getCategoryColor(category: string, colorMap: Map<string, string>) {
  if (!colorMap.has(category)) {
    const hue = Math.floor(Math.random() * 360)
    const saturation = 60 + Math.random() * 20
    const lightness = 45 + Math.random() * 15
    colorMap.set(category, `hsl(${hue}, ${saturation}%, ${lightness}%)`)
  }
  return colorMap.get(category)!
}

function createNodes(data: KnowledgeGraphNode[], w: number, h: number, colorMap: Map<string, string>): Node[] {
  return data.map((node, i) => {
    const angle = (i / data.length) * Math.PI * 2
    const distance = Math.min(w, h) * 0.4 + Math.random() * Math.min(w, h) * 0.3
    return {
      id: node.id,
      x: w / 2 + Math.cos(angle) * distance,
      y: h / 2 + Math.sin(angle) * distance,
      vx: 0,
      vy: 0,
      radius: (node.size || 6) * 2,
      color: getCategoryColor(node.categorySlug || 'default', colorMap),
      data: node,
    }
  })
}

function createParticles(links: Link[]): Particle[] {
  const particles: Particle[] = []
  links.forEach((link) => {
    particles.push({ sourceId: link.source, targetId: link.target, progress: 0, direction: 1 })
    particles.push({ sourceId: link.source, targetId: link.target, progress: 0.5, direction: 1 })
  })
  return particles
}

function applyForces(nodes: Node[], links: Link[]) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x
      const dy = nodes[j].y - nodes[i].y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = 500 / (dist * dist)
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      nodes[i].vx -= fx
      nodes[i].vy -= fy
      nodes[j].vx += fx
      nodes[j].vy += fy
    }
  }

  links.forEach((link) => {
    const s = nodeMap.get(link.source)
    const t = nodeMap.get(link.target)
    if (!s || !t) return
    const dx = t.x - s.x
    const dy = t.y - s.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const force = (dist - 100) * 0.01
    const fx = (dx / dist) * force
    const fy = (dy / dist) * force
    s.vx += fx
    s.vy += fy
    t.vx -= fx
    t.vy -= fy
  })

  nodes.forEach((n) => {
    n.x += n.vx
    n.y += n.vy
    n.vx *= 0.85
    n.vy *= 0.85
  })
}

export function useGraphCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  graphData: { nodes: KnowledgeGraphNode[]; links: Link[] },
  theme: 'dark' | 'light',
  setTooltip: (t: TooltipState) => void
) {
  const setTooltipRef = useRef(setTooltip)
  setTooltipRef.current = setTooltip

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || graphData.nodes.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colorMap = new Map<string, string>()
    let nodes = createNodes(graphData.nodes, canvas.width, canvas.height, colorMap)
    const particles = createParticles(graphData.links)
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    let hoveredNode: Node | null = null
    let isDragging = false
    let dragNode: Node | null = null
    let offsetX = 0
    let offsetY = 0
    let panX = 0
    let panY = 0
    let startPanX = 0
    let startPanY = 0
    let scale = 1

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - panX) / scale
      const mouseY = (e.clientY - rect.top - panY) / scale

      if (isDragging && dragNode) {
        dragNode.x = mouseX + offsetX
        dragNode.y = mouseY + offsetY
        dragNode.vx = 0
        dragNode.vy = 0
        return
      }

      if (isDragging && !dragNode) {
        panX = startPanX + (e.clientX - rect.left) - (e.clientX - rect.left)
        panY = startPanY + (e.clientY - rect.top) - (e.clientY - rect.top)
        return
      }

      let found: Node | null = null
      for (const node of nodes) {
        const dx = mouseX - node.x
        const dy = mouseY - node.y
        if (Math.sqrt(dx * dx + dy * dy) < node.radius * 1.5) {
          found = node
          break
        }
      }

      hoveredNode = found
      if (found) {
        setTooltipRef.current({
          visible: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          title: found.data.title,
          image: found.data.image ? found.data.image : undefined
        })
        canvas.style.cursor = 'pointer'
      } else {
        setTooltipRef.current({ visible: false, x: 0, y: 0, title: '' })
        canvas.style.cursor = isDragging ? 'grabbing' : 'grab'
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - panX) / scale
      const mouseY = (e.clientY - rect.top - panY) / scale

      for (const node of nodes) {
        const dx = mouseX - node.x
        const dy = mouseY - node.y
        if (Math.sqrt(dx * dx + dy * dy) < node.radius * 1.5) {
          isDragging = true
          dragNode = node
          offsetX = node.x - mouseX
          offsetY = node.y - mouseY
          canvas.style.cursor = 'grabbing'
          return
        }
      }

      isDragging = true
      startPanX = panX
      startPanY = panY
      canvas.style.cursor = 'grabbing'
    }

    const handleMouseUp = () => {
      isDragging = false
      dragNode = null
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab'
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const zoom = e.deltaY < 0 ? 1.1 : 0.9
      const newScale = Math.max(0.5, Math.min(3, scale * zoom))
      panX = mouseX - (mouseX - panX) * (newScale / scale)
      panY = mouseY - (mouseY - panY) * (newScale / scale)
      scale = newScale
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - panX) / scale
      const mouseY = (e.clientY - rect.top - panY) / scale
      for (const node of nodes) {
        const dx = mouseX - node.x
        const dy = mouseY - node.y
        if (Math.sqrt(dx * dx + dy * dy) < node.radius * 1.5) {
          if (node.data.slug) window.location.href = `/blog/${node.data.slug}`
          return
        }
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('click', handleClick)

    let animationId: number
    const animate = () => {
      ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#f8fafc'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(panX, panY)
      ctx.scale(scale, scale)

      if (!dragNode) applyForces(nodes, graphData.links)

      ctx.strokeStyle = theme === 'dark' ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.5)'
      ctx.lineWidth = 1
      graphData.links.forEach((link) => {
        const s = nodeMap.get(link.source)
        const t = nodeMap.get(link.target)
        if (!s || !t) return
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(t.x, t.y)
        ctx.stroke()
      })

      particles.forEach((p) => {
        p.progress += 0.01 * p.direction
        if (p.progress >= 1) { p.progress = 1; p.direction = -1 }
        if (p.progress <= 0) { p.progress = 0; p.direction = 1 }
        const s = nodeMap.get(p.sourceId)
        const t = nodeMap.get(p.targetId)
        if (!s || !t) return
        ctx.fillStyle = 'rgba(96, 165, 250, 0.7)'
        ctx.beginPath()
        ctx.arc(s.x + (t.x - s.x) * p.progress, s.y + (t.y - s.y) * p.progress, 2, 0, Math.PI * 2)
        ctx.fill()
      })

      nodes.forEach((node) => {
        const isHovered = hoveredNode === node
        const r = node.radius * (isHovered ? 1 : 0.5)
        ctx.fillStyle = node.color
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fill()
        if (isHovered) {
          ctx.strokeStyle = theme === 'dark' ? '#fff' : '#000'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })

      ctx.restore()
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('click', handleClick)
      window.removeEventListener('resize', resize)
    }
  }, [graphData, theme, canvasRef])
}
