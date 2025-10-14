'use client'
import axiosInstance from '@/libs/axios'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import * as THREE from 'three'

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false })

export default function KnowledgeGraph3D() {
    const [data, setData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] })

    const fetchKGData = async () => {
        await axiosInstance.get('/api/knowledge-graph').then((res) => {
            console.log(res.data)
            setData(res.data)
        })
    }

    useEffect(() => {
        fetchKGData()
    }, [])

return (
    <div className="w-full h-[80vh] border rounded-lg overflow-hidden">
      <ForceGraph3D
        graphData={data}
        nodeAutoColorBy="group"
        nodeLabel="title"
        linkOpacity={0.4}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={(l: any) => 0.002 + (l.value || 0) * 0.01}
        nodeThreeObject={(node: any) => {
          // doğrudan THREE modülünü kullan
          const geometry = new THREE.SphereGeometry((node.size || 6) / 10, 12, 12)
          const material = new THREE.MeshLambertMaterial({ color: node.color })
          const mesh = new THREE.Mesh(geometry, material)
          mesh.userData = node
          return mesh
        }}
        onNodeClick={(n: any) => window.open(`/blog/${n.categorySlug}/${n.slug}`, '_blank')}
      />
    </div>
  )
}