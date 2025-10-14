'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import axiosInstance from '@/libs/axios'

export default function GeoHeatmap() {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [data, setData] = useState<any[]>([])

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get('/api/analytics/geo')
      console.log(res.data)
      setData(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!data.length || mapRef.current) return

    // initialize map
    const map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          carto: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
          },
        },
        layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
      },
      center: [0, 30],
      zoom: 1.4,
    })
    mapRef.current = map

    // aggregate points by country & city (so tooltip shows count properly)
    const grouped = data.reduce((acc: any, curr: any) => {
      const key = `${curr.country}_${curr.city}`
      if (!acc[key]) {
        acc[key] = { ...curr, count: 1 }
      } else {
        acc[key].count += 1
      }
      return acc
    }, {})

    const features: GeoJSON.Feature<GeoJSON.Point>[] = Object.values(grouped).map((p: any) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
      properties: {
        country: p.country,
        city: p.city,
        count: p.count,
        weight: p.count,
      },
    }))

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features,
    }

    map.on('load', () => {
      map.addSource('visitors', { type: 'geojson', data: geojson })

      // heatmap layer
      map.addLayer({
        id: 'heat',
        type: 'heatmap',
        source: 'visitors',
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': 1.5,
          'heatmap-radius': 25,
          'heatmap-opacity': 0.8,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)',
          ],
        },
      })

      // circle layer for tooltips
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'visitors',
        paint: {
          'circle-radius': 5,
          'circle-color': '#007bff',
          'circle-opacity': 0.6,
        },
      })

      // popup for tooltip
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      })

      map.on('mouseenter', 'points', (e) => {
        map.getCanvas().style.cursor = 'pointer'

        const feature = e.features?.[0]
        if (!feature) return

        const { country, city, count } = feature.properties as any

        const geometry = feature.geometry as GeoJSON.Point
        popup
          .setLngLat(geometry.coordinates as [number, number])
          .setHTML(`
            <div style="font-family:sans-serif;min-width:150px">
              <strong>${city}, ${country}</strong><br/>
              <span>${count} visitor${count > 1 ? 's' : ''}</span>
            </div>
          `)
          .addTo(map)
      })

      map.on('mouseleave', 'points', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
    })

    return () => map.remove()
  }, [data])

  return <div id="map" className="w-full h-full rounded-xl shadow-lg" />
}
