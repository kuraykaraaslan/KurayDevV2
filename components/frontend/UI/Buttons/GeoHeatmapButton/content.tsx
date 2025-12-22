'use client'

import { useEffect, useRef, useState } from 'react'
import axiosInstance from '@/libs/axios'
import i18n from "@/libs/localize/localize";

export default function GeoHeatmap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [data, setData] = useState<any[]>([])

  const { t } = i18n;

  const fetchGeoData = async () => {
    await axiosInstance.get('/api/analytics/geo').then((res) => {
      setData(res.data);
    }).catch((err) => {
      console.error(err);
    });
  };

  // --- 1. Fetch Geo Analytics ---
  useEffect(() => {
    fetchGeoData();
  }, []);

  // --- 2. Initialize Map when data ready ---
  useEffect(() => {
    if (!data.length || mapRef.current) return

    ;(async () => {
      // Load MapLibre on client side
      if (!window.maplibregl) {
        await loadMapLibreFromCDN()
      }
      const maplibregl = window.maplibregl

      // Create map instance
      const map = new maplibregl.Map({
        container: mapContainer.current!,
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
        center: [20, 30],
        zoom: 1.4,
      })

      mapRef.current = map

      // --- 3. Convert DB data → GeoJSON ---
        const features: GeoJSON.Feature<GeoJSON.Point>[] = data.map((p) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [p.lon, p.lat],
        },
        properties: {
          id: p.id,
          country: p.country,
          city: p.city,
          count: p.count,
          weight: p.count, // heatmap intensity
        },
      }))

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features,
      }

      // --- 4. Add layers when map loads ---
      map.on('load', () => {
        map.addSource("visitors", {
          type: "geojson",
          data: geojson,
        })

        // Heatmap Layer
        map.addLayer({
          id: "heat",
          type: "heatmap",
          source: "visitors",
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': 0.5,
            'heatmap-radius': 12,
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
              1, 'rgb(178,24,43)'
            ],
          },
        })

        // Circle Points
        map.addLayer({
          id: "points",
          type: "circle",
          source: "visitors",
          paint: {
            'circle-radius': 6,
            'circle-color': '#007bff',
            'circle-opacity': 0.65,
          },
        })

        // --- Popup ---
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
        })

        map.on("mouseenter", "points", (e: any) => {
          map.getCanvas().style.cursor = "pointer"
          const feature = e.features?.[0]
          if (!feature) return

          const { country, city, count } = feature.properties
          const coords = feature.geometry.coordinates

          popup
            .setLngLat(coords)
            .setHTML(`
              <div style="font-family:sans-serif; min-width:150px">
                <strong>${city}, ${country}</strong><br/>
                <span>${count} ${t("shared.geomap.visitors", { count: count })}</span></span>
              </div>
            `)
            .addTo(map)
        })

        map.on("mouseleave", "points", () => {
          map.getCanvas().style.cursor = ""
          popup.remove()
        })
      })
    })()

    return () => mapRef.current?.remove()
  }, [data])

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-xl shadow-lg"
    />
  )
}

// --- Helper: Load MapLibre from CDN ---
async function loadMapLibreFromCDN() {
  if (window.maplibregl) return

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"
      script.onload = () => resolve()
      script.onerror = reject
      document.head.appendChild(script)
    }),
    new Promise<void>((resolve, reject) => {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css"
      link.onload = () => resolve()
      link.onerror = reject
      document.head.appendChild(link)
    }),
  ])
}
