'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { KnowledgeGraphNode } from '@/types/KnowledgeGraphTypes'
import axiosInstance from '@/libs/axios'
import { useParams } from 'next/navigation'
import type * as ThreeJSTypes from 'three'

/* -------------------- Helpers -------------------- */


// ✨ Ping-pong partiküller
function createParticles(scene: ThreeJSTypes.Scene, linksData: any[], nodeMap: Map<string, any>) {
  const particles: ThreeJSTypes.Points[] = []
  linksData.forEach(link => {
    const s = nodeMap.get(link.source), t = nodeMap.get(link.target)
    if (!s || !t) return
    const geom = new THREE.BufferGeometry()
    const pos = new Float32Array(6)
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 1, transparent: true, opacity: 0.7 })
    const p = new THREE.Points(geom, mat)
    p.userData = { source: s, target: t, progress: [0, 0.5], direction: [1, -1] }
    scene.add(p)
    particles.push(p)
  })
  return particles
}

// her frame’de çağrılır
function updateParticles(particles: ThreeJSTypes.Points[]) {
  particles.forEach(p => {
    const { source, target, progress, direction } = p.userData
    const pos = p.geometry.attributes.position.array as Float32Array
    progress.forEach((prog: number, i: number) => {
      prog += 0.01 * direction[i]
      if (prog >= 1) { prog = 1; direction[i] = -1 }
      if (prog <= 0) { prog = 0; direction[i] = 1 }
      progress[i] = prog
      pos[i * 3]     = source.mesh.position.x + (target.mesh.position.x - source.mesh.position.x) * prog
      pos[i * 3 + 1] = source.mesh.position.y + (target.mesh.position.y - source.mesh.position.y) * prog
      pos[i * 3 + 2] = source.mesh.position.z + (target.mesh.position.z - source.mesh.position.z) * prog
    })
    p.geometry.attributes.position.needsUpdate = true
  })
}


/* -------------------- Helper Functions -------------------- */

// Tema belirleme
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
    attributeFilter: ['class', 'data-theme']
  })
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', checkTheme)

  return () => {
    observer.disconnect()
    mediaQuery.removeEventListener('change', checkTheme)
  }
}

// Kategoriye göre renk üretme
function useCategoryColor() {
  let colorMap: Record<string, string> = {}


  const getColor = (category: string) => {
    if (!colorMap[category]) {
      const hue = Math.floor(Math.random() * 360)
      const saturation = 60 + Math.random() * 20
      const lightness = 45 + Math.random() * 15
      colorMap[category] = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
    return colorMap[category]
  }
  return getColor
}

// Üç boyutlu sahneyi kurar
function setupScene(container: HTMLDivElement, theme: 'dark' | 'light') {
  const w = container.clientWidth
  const h = container.clientHeight

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000)
  camera.position.z = 400

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  renderer.setClearColor(theme === 'dark' ? 0x0f172a : 0xf8fafc)

  // Kontroller
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableZoom = true
  controls.minDistance = 100
  controls.maxDistance = 1000

  // Işıklar
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
  directionalLight.position.set(10, 10, 10)
  scene.add(directionalLight)

  return { scene, camera, renderer, controls }
}

// Düğümleri (node) oluşturur
function createNodes(scene: ThreeJSTypes.Scene, data: KnowledgeGraphNode[], getColor: (cat: string) => string) {
  const nodeMap = new Map()
  data.forEach((node, i) => {
    const radius = (node.size || 6) / 10
    const geometry = new THREE.SphereGeometry(radius, 16, 16)
    const material = new THREE.MeshLambertMaterial({
      color: getColor(node.categorySlug || 'default')
    })
    const mesh = new THREE.Mesh(geometry, material)
    const angle = (i / data.length) * Math.PI * 2
    const distance = 100
    mesh.position.x = Math.cos(angle) * distance
    mesh.position.y = Math.sin(angle) * distance
    mesh.position.z = (Math.random() - 0.5) * 50
    mesh.userData = node
    scene.add(mesh)
    nodeMap.set(node.id, { mesh, data: node })
  })
  return nodeMap
}

// Bağlantıları (link) oluşturur
function createLinks(scene: ThreeJSTypes.Scene, data: any[], nodeMap: Map<string, any>) {
  const links: THREE.Line[] = []
  data.forEach(link => {
    const s = nodeMap.get(link.source)
    const t = nodeMap.get(link.target)
    if (!s || !t) return
    const points = [s.mesh.position, t.mesh.position]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.5
    })
    const line = new THREE.Line(geometry, material)
    scene.add(line)
    links.push(line)
  })
  return links
}

type TooltipState = {
  visible: boolean
  x: number
  y: number
  title: string
  image?: string
}

// Hover tooltip
function setupInteractions(
  container: HTMLDivElement,
  camera: ThreeJSTypes.Camera,
  nodeMap: Map<string, any>,
  setTooltip: (t: any) => void
) {
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2()
  let hovered: ThreeJSTypes.Mesh | null = null
  const move = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    ray.setFromCamera(mouse, camera)
    const hits = ray.intersectObjects(Array.from(nodeMap.values()).map(n => n.mesh))
    if (hovered) hovered.scale.set(1, 1, 1)
    if (hits.length) {
      hovered = hits[0].object as ThreeJSTypes.Mesh
      hovered.scale.set(1.5, 1.5, 1.5)
      const n = hovered.userData
      setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, title: n.title || '', image: n.image })
    } else {
      setTooltip((prev: TooltipState) => ({ ...prev, visible: false }))
      hovered = null
    }
  }
  container.addEventListener('mousemove', move)
  return () => container.removeEventListener('mousemove', move)
}

/* -------------------- Main Component -------------------- */

export default function KnowledgeGraph3D({ className }: { className?: string }) {
  const { categorySlug } = useParams() as { categorySlug?: string }
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<{ nodes: KnowledgeGraphNode[]; links: any[] }>({ nodes: [], links: [] })
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', image: '' })

  useEffect(() => detectTheme(setTheme), [])

  useEffect(() => {
    axiosInstance.get('/api/knowledge-graph?' + (categorySlug ? `categorySlug=${categorySlug}` : ''))
      .then(res => setData(res.data))
  }, [categorySlug])

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return
    const container = containerRef.current
    const { scene, camera, renderer } = setupScene(container, theme)
    const getColor = useCategoryColor()
    const nodes = createNodes(scene, data.nodes, getColor)
    createLinks(scene, data.links, nodes)
    const particles = createParticles(scene, data.links, nodes)
    const cleanup = setupInteractions(container, camera, nodes, setTooltip)

    const animate = () => {
      requestAnimationFrame(animate)
      updateParticles(particles)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cleanup()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [data, theme])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className={`w-full h-full ${className}`} style={{ minHeight: 600, cursor: 'grab' }} />
      {tooltip.visible && (
        <div
          className="absolute z-50 pointer-events-none px-3 py-2 rounded-lg shadow-lg text-sm font-medium max-w-xs"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`
          }}
        >
          {tooltip.image && <img src={tooltip.image} alt="" className="w-full mb-2 rounded" />}
          <div>{tooltip.title}</div>
        </div>
      )}
    </div>
  )
}
