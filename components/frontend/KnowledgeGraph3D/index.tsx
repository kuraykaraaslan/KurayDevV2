'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { KnowledgeGraphNode } from '@/types/KnowledgeGraphTypes'
import axiosInstance from '@/libs/axios';
import { useParams } from 'next/navigation';

export default function KnowledgeGraph3D({ className }: { className?: string }) {

  const { categorySlug } = useParams() as { categorySlug?: string };
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  const [data, setData] = useState<{ nodes: KnowledgeGraphNode[]; links: any[] }>({ nodes: [], links: [] })
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; title: string }>({
    visible: false,
    x: 0,
    y: 0,
    title: ''
  })

  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    nodes: Map<string, { mesh: THREE.Mesh; data: any; velocity: THREE.Vector3; originalScale: number; fixed?: boolean }>
    links: THREE.Line[]
    particles: THREE.Points[]
    animationId: number | null
  } | null>(null)

  // --- fetch data ---
  const fetchKGData = async () => {
    await axiosInstance.get('/api/knowledge-graph?' + (categorySlug ? `categorySlug=${categorySlug}` : '')).then((res) => {
      console.log(res.data)
      setData(res.data)
    })
  }

  useEffect(() => { 
    console.log('categorySlug changed:', categorySlug);
    fetchKGData() }, [categorySlug])

  // --- theme detection ---
  useEffect(() => {
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
  }, [])

  // --- random color by category ---
  const categoryColorMap = useRef<Record<string, string>>({})
  const getColorForCategory = (category: string) => {
    if (!categoryColorMap.current[category]) {
      const hue = Math.floor(Math.random() * 360)
      const saturation = 60 + Math.random() * 20
      const lightness = 45 + Math.random() * 15
      categoryColorMap.current[category] = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
    return categoryColorMap.current[category]
  }

  // --- main scene ---
  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return

    const container = containerRef.current
    const w = container.clientWidth
    const h = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000)
    camera.position.z = 400

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    // disable right-click
    //container.addEventListener('contextmenu', e => e.preventDefault())

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 100;
    controls.maxDistance = 1000;

    // camera movement
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }
    let cameraRotation = { x: 0, y: 0 }
    let cameraDistance = 400
    const cameraTarget = new THREE.Vector3(0, 0, 0)

    const updateCameraPosition = () => {
      const x = cameraTarget.x + cameraDistance * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x)
      const y = cameraTarget.y + cameraDistance * Math.sin(cameraRotation.x)
      const z = cameraTarget.z + cameraDistance * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x)
      camera.position.set(x, y, z)
      camera.lookAt(cameraTarget)
    }

    // lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight.position.set(10, 10, 10)
    scene.add(directionalLight)

    // --- nodes ---
    const nodeMap = new Map()
    data.nodes.forEach((node, i) => {
      const radius = (node.size || 6) / 10
      const geometry = new THREE.SphereGeometry(radius, 16, 16)
      const color = getColorForCategory(node.categorySlug || 'default')
      const material = new THREE.MeshLambertMaterial({ color })
      const mesh = new THREE.Mesh(geometry, material)
      const angle = (i / data.nodes.length) * Math.PI * 2
      const distance = 100
      mesh.position.x = Math.cos(angle) * distance
      mesh.position.y = Math.sin(angle) * distance
      mesh.position.z = (Math.random() - 0.5) * 50
      mesh.userData = node
      scene.add(mesh)
      nodeMap.set(node.id, { mesh, data: node, velocity: new THREE.Vector3(), originalScale: 1 })
    })

    // --- links ---
    const links: THREE.Line[] = []
    data.links.forEach(link => {
      const s = nodeMap.get(link.source)
      const t = nodeMap.get(link.target)
      if (!s || !t) return
      const points = [s.mesh.position, t.mesh.position]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.5 })
      const line = new THREE.Line(geometry, material)
      scene.add(line)
      links.push(line)
    })

    // --- moving particles (ping-pong) ---
    const particles: THREE.Points[] = []
    data.links.forEach(link => {
      const source = nodeMap.get(link.source)
      const target = nodeMap.get(link.target)
      if (!source || !target) return
      const geom = new THREE.BufferGeometry()
      const pos = new Float32Array(6)
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 1, transparent: true, opacity: 0.7 })
      const p = new THREE.Points(geom, mat)
      p.userData = { source, target, progress: [0, 0.5], direction: [1, -1] }
      scene.add(p)
      particles.push(p)
    })

    sceneRef.current = { scene, camera, renderer, nodes: nodeMap, links, particles, animationId: null }

    // --- interaction setup ---
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let hoveredNode: THREE.Mesh | null = null
    let draggedNode: { mesh: THREE.Mesh } | null = null

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(Array.from(nodeMap.values()).map(n => n.mesh))
      if (intersects.length > 0) {
        draggedNode = { mesh: intersects[0].object as THREE.Mesh }
        nodeMap.get(draggedNode.mesh.userData.id)!.fixed = true
        container.style.cursor = 'grabbing'
      } else {
        isDragging = true
        previousMousePosition = { x: e.clientX, y: e.clientY }
        container.style.cursor = 'grabbing'
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      if (draggedNode) {
        const deltaX = (e.movementX / rect.width) * cameraDistance * 2
        const deltaY = (e.movementY / rect.height) * cameraDistance * 2
        draggedNode.mesh.position.x += deltaX
        draggedNode.mesh.position.y -= deltaY
        setTooltip(prev => ({ ...prev, visible: false }))
      } else if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x
        const deltaY = e.clientY - previousMousePosition.y
        cameraRotation.y += deltaX * 0.005
        cameraRotation.x += deltaY * 0.005
        cameraRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraRotation.x))
        updateCameraPosition()
        previousMousePosition = { x: e.clientX, y: e.clientY }
      } else {
        // hover tooltip
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(Array.from(nodeMap.values()).map(n => n.mesh))
        if (hoveredNode) {
          const nodeData = nodeMap.get(hoveredNode.userData.id)
          if (nodeData) hoveredNode.scale.set(nodeData.originalScale, nodeData.originalScale, nodeData.originalScale)
        }
        if (intersects.length > 0) {
          hoveredNode = intersects[0].object as THREE.Mesh
          const nodeData = nodeMap.get(hoveredNode.userData.id)
          if (nodeData) hoveredNode.scale.set(1.5, 1.5, 1.5)
          container.style.cursor = 'pointer'
          setTooltip({
            visible: true,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            title: hoveredNode.userData.title || 'Untitled'
          })
        } else {
          hoveredNode = null
          container.style.cursor = 'grab'
          setTooltip(prev => ({ ...prev, visible: false }))
        }
      }
    }

    const onMouseUp = () => {
      if (draggedNode) {
        const n = nodeMap.get(draggedNode.mesh.userData.id)
        if (n) n.fixed = false
        draggedNode = null
      }
      isDragging = false
      container.style.cursor = 'grab'
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cameraDistance += e.deltaY * 0.3
      cameraDistance = Math.max(100, Math.min(1000, cameraDistance))
      updateCameraPosition()
    }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel, { passive: false })

    // --- physics + animation ---
    const forceStrength = 0.5
    const dampening = 0.95
    const linkDistance = 50

    const applyForces = () => {
      const nodes = Array.from(nodeMap.values())
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          if (a.fixed || b.fixed) continue
          const delta = new THREE.Vector3().subVectors(a.mesh.position, b.mesh.position)
          const distance = delta.length()
          if (distance > 0) {
            const force = forceStrength / (distance * distance)
            delta.normalize().multiplyScalar(force)
            a.velocity.add(delta)
            b.velocity.sub(delta)
          }
        }
      }

      data.links.forEach(link => {
        const s = nodeMap.get(link.source)
        const t = nodeMap.get(link.target)
        if (!s || !t) return
        const delta = new THREE.Vector3().subVectors(t.mesh.position, s.mesh.position)
        const distance = delta.length()
        const force = (distance - linkDistance) * 0.01
        delta.normalize().multiplyScalar(force)
        if (!s.fixed) s.velocity.add(delta)
        if (!t.fixed) t.velocity.sub(delta)
      })

      nodes.forEach(node => {
        if (node.fixed) return
        node.mesh.position.add(node.velocity)
        node.velocity.multiplyScalar(dampening)
      })

      links.forEach((line, i) => {
        const link = data.links[i]
        const s = nodeMap.get(link.source)
        const t = nodeMap.get(link.target)
        if (s && t) {
          const pos = line.geometry.attributes.position.array as Float32Array
          pos[0] = s.mesh.position.x
          pos[1] = s.mesh.position.y
          pos[2] = s.mesh.position.z
          pos[3] = t.mesh.position.x
          pos[4] = t.mesh.position.y
          pos[5] = t.mesh.position.z
          line.geometry.attributes.position.needsUpdate = true
        }
      })

      // particles ping-pong
      particles.forEach(p => {
        const { source, target, progress, direction } = p.userData
        const pos = p.geometry.attributes.position.array as Float32Array
        progress.forEach((prog: number, i: number) => {
          prog += 0.01 * direction[i]
          if (prog >= 1) { prog = 1; direction[i] = -1 }
          if (prog <= 0) { prog = 0; direction[i] = 1 }
          progress[i] = prog
          pos[i * 3] = source.mesh.position.x + (target.mesh.position.x - source.mesh.position.x) * prog
          pos[i * 3 + 1] = source.mesh.position.y + (target.mesh.position.y - source.mesh.position.y) * prog
          pos[i * 3 + 2] = source.mesh.position.z + (target.mesh.position.z - source.mesh.position.z) * prog
        })
        p.geometry.attributes.position.needsUpdate = true
      })
    }

    const animate = () => {
      sceneRef.current!.animationId = requestAnimationFrame(animate)
      applyForces()
      renderer.render(scene, camera)
    }
    animate()

    // --- cleanup ---
    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      if (sceneRef.current?.animationId) cancelAnimationFrame(sceneRef.current.animationId)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      window.removeEventListener('resize', onResize)
    }
  }, [data])

  // --- theme updates ---
  useEffect(() => {
    if (!sceneRef.current) return
    const { renderer, links } = sceneRef.current
    const bg = theme === 'dark' ? 0x0f172a : 0xf8fafc
    const linkColor = theme === 'dark' ? 0x64748b : 0x000000
    renderer.setClearColor(bg)
    links.forEach(l => (l.material as THREE.LineBasicMaterial).color.setHex(linkColor))
  }, [theme])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className={`relative w-full h-full ${className}`} style={{ minHeight: '600px', cursor: 'grab' }} />
      {tooltip.visible && (
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none z-50 px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`
          }}
        >
          {tooltip.title}
        </div>
      )}
    </div>
  )
}
