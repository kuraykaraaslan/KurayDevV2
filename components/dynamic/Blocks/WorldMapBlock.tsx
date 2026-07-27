'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import BaseBlock, {
  BASE_BLOCK_DEFAULT_PROPS,
  BASE_BLOCK_SCHEMA_FIELDS,
  parseBaseBlockProps,
} from '../partials/BaseBlock'
import type { BlockDefinition } from '../types'

// react-svg-worldmap touches the DOM during sizing — render it client-only.
const WorldMap = dynamic(() => import('react-svg-worldmap'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-80 items-center justify-center text-base-content/30">
      <span className="loading loading-spinner loading-lg" />
    </div>
  ),
})

interface Place {
  country: string // ISO 3166-1 alpha-2 code, e.g. "tr"
  label?: string  // city / note shown in the legend
  year?: string
}

function parsePlaces(raw: unknown): Place[] {
  let list: Place[] = []
  try {
    list = typeof raw === 'string' ? JSON.parse(raw) : (raw as Place[]) ?? []
  } catch {
    list = []
  }
  return Array.isArray(list) ? list.filter((p) => p && typeof p.country === 'string') : []
}

// ISO2 → 🇹🇷 flag emoji via regional indicator symbols
function flagEmoji(iso2: string): string {
  const code = (iso2 || '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return '🌍'
  const base = 0x1f1e6 // 'A'
  return String.fromCodePoint(...[...code].map((c) => base + c.charCodeAt(0) - 65))
}

function WorldMapBlock(rawProps: Record<string, unknown>) {
  const baseProps = parseBaseBlockProps(rawProps)
  const heading = rawProps.heading as string | undefined
  const headingAccent = rawProps.headingAccent as string | undefined
  const subtitle = rawProps.subtitle as string | undefined
  const color = (rawProps.color as string) || '#422ad5'
  const showLegend = rawProps.showLegend !== false

  // Visitors can collapse the place pins on the page.
  const [legendOpen, setLegendOpen] = useState(true)

  const places = useMemo(() => parsePlaces(rawProps.places), [rawProps.places])

  // Aggregate places by country → choropleth data. Repeat visits deepen the color.
  const data = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of places) {
      const cc = p.country.trim().toLowerCase()
      if (cc) counts.set(cc, (counts.get(cc) ?? 0) + 1)
    }
    return Array.from(counts, ([country, value]) => ({ country, value }))
  }, [places])

  const countryCount = data.length

  return (
    <BaseBlock {...baseProps}>
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-12 lg:px-20">
        {(heading || subtitle) && (
          <div className="mb-12 text-center">
            {heading && (
              <h2 className="mb-4 text-4xl text-base-content md:text-5xl">
                {heading}
                {headingAccent && (
                  <> <span className="text-primary">{headingAccent}</span></>
                )}
              </h2>
            )}
            {subtitle && (
              <p className="mx-auto max-w-3xl text-lg text-base-content/70">{subtitle}</p>
            )}
          </div>
        )}

        <div className="flex justify-center">
          {data.length > 0 ? (
            <WorldMap
              data={data}
              color={color}
              backgroundColor="transparent"
              borderColor="rgba(120,120,120,0.35)"
              strokeOpacity={0.6}
              size="responsive"
              richInteraction
              tooltipTextFunction={({ countryName, countryValue }) =>
                Number(countryValue) > 1
                  ? `${countryName} — ${countryValue} ziyaret`
                  : countryName
              }
            />
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center gap-2 text-base-content/30">
              <span className="text-4xl">🗺️</span>
              <p className="text-sm">Henüz yer eklenmedi — sağdan ülke kodu ekleyin.</p>
            </div>
          )}
        </div>

        {countryCount > 0 && (
          <p className="mt-6 text-center text-sm text-base-content/50">
            {countryCount} ülke · {places.length} yer
          </p>
        )}

        {showLegend && places.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setLegendOpen((v) => !v)}
                aria-expanded={legendOpen}
                className="btn btn-ghost btn-sm gap-1.5 text-base-content/60"
              >
                {legendOpen ? 'Yerleri gizle' : `Yerleri göster (${places.length})`}
                <span className={`transition-transform ${legendOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>
            </div>
            {legendOpen && (
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {places.map((place, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 rounded-full border border-base-content/10 bg-base-200 px-3 py-1.5 text-sm text-base-content/80"
                  >
                    <span className="text-base leading-none">{flagEmoji(place.country)}</span>
                    <span>{place.label || place.country.toUpperCase()}</span>
                    {place.year && <span className="text-xs text-base-content/40">{place.year}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </BaseBlock>
  )
}

const DEFAULT_PLACES: Place[] = [
  { country: 'tr', label: 'İstanbul', year: '2023' },
  { country: 'de', label: 'Berlin', year: '2022' },
  { country: 'nl', label: 'Amsterdam', year: '2022' },
  { country: 'it', label: 'Roma', year: '2021' },
  { country: 'gb', label: 'Londra', year: '2019' },
  { country: 'us', label: 'New York', year: '2018' },
]

export const WorldMapBlockDefinition: BlockDefinition = {
  type: 'WorldMapBlock',
  label: 'World Map',
  category: 'Media',
  description: 'Gidilen yerleri dünya haritasında ülke bazında renklendiren interaktif harita.',
  defaultProps: {
    heading: 'Gittiğim',
    headingAccent: 'Yerler',
    subtitle: 'Dünya üzerinde adımımın değdiği ülkeler.',
    color: '#422ad5',
    showLegend: true,
    places: DEFAULT_PLACES,
    blockClass: 'bg-base-100',
    sectionId: 'world-map',
    ...BASE_BLOCK_DEFAULT_PROPS,
  },
  schema: {
    heading: { label: 'Heading (main part)', type: 'text' },
    headingAccent: { label: 'Heading Accent (primary-colored part)', type: 'text' },
    subtitle: { label: 'Subtitle', type: 'textarea' },
    color: { label: 'Highlight Color', type: 'color' },
    showLegend: { label: 'Show Place Legend', type: 'boolean' },
    places: {
      label: 'Places',
      type: 'repeater',
      fields: {
        country: { label: 'Country Code (ISO2, e.g. tr)', type: 'text', value: '' },
        label:   { label: 'City / Note',                   type: 'text', value: '' },
        year:    { label: 'Year',                          type: 'text', value: '' },
      },
    },
    ...BASE_BLOCK_SCHEMA_FIELDS,
  },
  Component: WorldMapBlock as unknown as BlockDefinition['Component'],
}

export default WorldMapBlock
