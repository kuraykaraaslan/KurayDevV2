import { ImageResponse } from 'next/og'
import redis from '@/libs/redis'

export interface OGImageOptions {
  title: string
  description?: string | null
  coverImage?: string | null
  badge?: string
}

const CACHE_TTL = 60 * 60 * 24 * 7 // 7 days

const RESPONSE_HEADERS = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=604800',
} as const

const svgPattern = encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'>
    <defs>
      <pattern id='g' x='0' y='0' width='60' height='60' patternUnits='userSpaceOnUse'>
        <path d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(96,93,255,0.06)' stroke-width='1'/>
      </pattern>
    </defs>
    <rect width='1200' height='630' fill='%231d232a'/>
    <rect width='1200' height='630' fill='url(%23g)'/>
    <rect x='0' y='0' width='6' height='630' fill='%23605dff'/>
    <circle cx='1100' cy='80' r='200' fill='rgba(96,93,255,0.04)'/>
    <circle cx='1050' cy='550' r='120' fill='rgba(96,93,255,0.03)'/>
  </svg>
`)

function buildFromCache(cached: string): Response {
  const buffer = Buffer.from(cached, 'base64')
  return new Response(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    { status: 200, headers: RESPONSE_HEADERS }
  )
}

function buildFromBuffer(arrayBuffer: ArrayBuffer): Response {
  return new Response(arrayBuffer, { status: 200, headers: RESPONSE_HEADERS })
}

function renderJSX({ title, description, coverImage, badge }: OGImageOptions) {
  if (coverImage) {
    return <img src={coverImage} width={1200} height={630} alt={title} />
  }

  const truncatedTitle = title.length > 80 ? title.slice(0, 77) + '…' : title
  const truncatedDesc = description
    ? description.length > 140 ? description.slice(0, 137) + '…' : description
    : null

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#1d232a',
        backgroundImage: `url("data:image/svg+xml,${svgPattern}")`,
        backgroundSize: 'cover',
        padding: '80px 100px 80px 120px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {badge && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <div
            style={{
              backgroundColor: 'rgba(96,93,255,0.15)',
              border: '1px solid rgba(96,93,255,0.3)',
              borderRadius: 6,
              padding: '6px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: '#939fff',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {badge}
          </div>
        </div>
      )}

      <div
        style={{
          fontSize: truncatedTitle.length > 50 ? 52 : 64,
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.15,
          marginBottom: truncatedDesc ? 24 : 0,
          maxWidth: 900,
        }}
      >
        {truncatedTitle}
      </div>

      {truncatedDesc && (
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.5,
            maxWidth: 820,
          }}
        >
          {truncatedDesc}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: '#605dff',
        }}
      />
    </div>
  )
}

export default class OGService {
  static async generate(options: OGImageOptions, cacheKey: string): Promise<Response> {
    const cached = await redis.get(cacheKey)
    if (cached) return buildFromCache(cached)

    const res = new ImageResponse(renderJSX(options), { width: 1200, height: 630 })
    const arrayBuffer = await res.arrayBuffer()
    await redis.setex(cacheKey, CACHE_TTL, Buffer.from(arrayBuffer).toString('base64'))
    return buildFromBuffer(arrayBuffer)
  }

  static async clearByKey(cacheKey: string) {
    await redis.del(cacheKey)
  }

  static async clearByPrefix(prefix: string) {
    const keys = await redis.keys(`${prefix}*`)
    if (keys.length > 0) await redis.del(...keys)
    return { cleared: keys.length }
  }
}
