import { ImageResponse } from 'next/og'

export const alt = 'Kuray Karaaslan — Software Architect & Product Engineer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const subtitle =
    lang === 'tr'
      ? 'Software Architect & Product Engineer · BIM & IoT Developer'
      : 'Software Architect & Product Engineer · BIM & IoT Developer'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(135deg, #1d2a35 0%, #243341 50%, #2a3d4d 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 28,
            opacity: 0.7,
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 32,
          }}
        >
          kuray.dev
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 24,
            letterSpacing: -2,
          }}
        >
          Kuray Karaaslan
        </div>
        <div
          style={{
            fontSize: 40,
            opacity: 0.85,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            right: 80,
            display: 'flex',
            gap: 16,
            fontSize: 22,
            opacity: 0.6,
          }}
        >
          <span>React</span>
          <span>·</span>
          <span>Next.js</span>
          <span>·</span>
          <span>IoT</span>
          <span>·</span>
          <span>BIM</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
