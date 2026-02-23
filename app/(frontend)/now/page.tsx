import type { Metadata } from 'next'
import MetadataHelper from '@/helpers/MetadataHelper'

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

export const metadata: Metadata = {
  title: 'Now | Kuray Karaaslan',
  description: 'What Kuray Karaaslan is focused on right now — work, side projects, learning, and life.',
  keywords: [
    'Kuray Karaaslan',
    'Software Developer',
    'Now Page',
    'IoT',
    'MQTT',
    'Java Spring Boot',
    'React',
    'Next.js',
    'Distributed Systems',
    'İzmir',
    'Turkey',
  ],
  robots: { index: true, follow: true },
  authors: [{ name: 'Kuray Karaaslan', url: `${APPLICATION_HOST}` }],
  openGraph: {
    title: 'Now | Kuray Karaaslan',
    description: 'What Kuray Karaaslan is focused on right now — work, side projects, learning, and life.',
    type: 'website',
    url: `${APPLICATION_HOST}/now`,
    images: [
      {
        url: `${APPLICATION_HOST}/assets/img/og.png`,
        width: 1200,
        height: 630,
        alt: 'Kuray Karaaslan - Now',
      },
    ],
    locale: 'en_US',
    siteName: 'Kuray Karaaslan',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@kuraykaraaslan',
    creator: '@kuraykaraaslan',
    title: 'Now | Kuray Karaaslan',
    description: 'What Kuray Karaaslan is focused on right now — work, side projects, learning, and life.',
    images: [`${APPLICATION_HOST}/assets/img/og.png`],
  },
  alternates: {
    canonical: `${APPLICATION_HOST}/now`,
  },
}

const jsonLdMeta: Metadata = {
  title: 'Now | Kuray Karaaslan',
  description: 'What Kuray Karaaslan is focused on right now — work, side projects, learning, and life.',
  openGraph: {
    title: 'Now | Kuray Karaaslan',
    description: 'What Kuray Karaaslan is focused on right now.',
    type: 'website',
    url: `${APPLICATION_HOST}/now`,
    images: [`${APPLICATION_HOST}/assets/img/og.png`],
  },
}

export default function NowPage() {
  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMeta)}
      <section className="min-h-screen bg-base-100 pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-6">

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-3">/now</h1>
            <p className="text-base-content/50 text-sm">
              Last updated: <span className="font-mono">February 2026</span> &mdash; İzmir, Turkey
            </p>
            <p className="text-base-content/40 text-xs mt-1">
              This is a <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">now page</a>. It tells you what I&apos;m focused on at this point in my life.
            </p>
          </div>

          <div className="space-y-12">

            {/* Work */}
            <div>
              <h2 className="text-lg font-bold mb-3 text-primary">Work</h2>
              <div className="space-y-2 text-base-content/80 leading-relaxed">
                <p>
                  Focused on IoT and BIM projects. Day to day I build communication infrastructure between devices and servers using MQTT, WebSocket, and REST, and work on turning building data into useful, connected systems.
                </p>
                <p>
                  Also handling network monitoring and server-side deployments on Linux.
                </p>
              </div>
            </div>

            {/* Side Project */}
            <div>
              <h2 className="text-lg font-bold mb-3 text-primary">Side Project</h2>
              <div className="space-y-2 text-base-content/80 leading-relaxed">
                <p>
                  Working on SaaS-focused side projects, with most of my attention on payment flows and security. I&apos;m especially interested in making billing, authentication, and access control reliable without hurting UX.
                </p>
              </div>
            </div>

            {/* Learning */}
            <div>
              <h2 className="text-lg font-bold mb-3 text-primary">Learning</h2>
              <div className="space-y-2 text-base-content/80 leading-relaxed">
                <p>
                  Going deeper into distributed systems — specifically event-driven architecture and message queues. Also spending time on system design to get better at thinking about scalability before writing a single line.
                </p>
              </div>
            </div>

            {/* Reading */}
            <div>
              <h2 className="text-lg font-bold mb-3 text-primary">Reading</h2>
              <div className="space-y-2 text-base-content/80 leading-relaxed">
                <p>
                  <em>Designing Data-Intensive Applications</em> by Martin Kleppmann. Slowly. It&apos;s dense but rewarding.
                </p>
              </div>
            </div>

            {/* Life */}
            <div>
              <h2 className="text-lg font-bold mb-3 text-primary">Life</h2>
              <div className="space-y-2 text-base-content/80 leading-relaxed">
                <p>
                  I&apos;ve been setting up my own smart home as an ongoing personal lab, experimenting with automations, sensors, and practical IoT integrations.
                </p>
                <p>
                  Based in İzmir. Trying to get outside more, go for runs, and spend less time doom-scrolling. Some days go better than others.
                </p>
                <p>
                  Photography is also one of my hobbies, especially when I want to slow down and reset after long coding sessions.
                </p>
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="mt-16 pt-8 border-t border-base-300">
            <p className="text-base-content/30 text-xs">
              Inspired by <a href="https://nownownow.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">nownownow.com</a>
            </p>
          </div>

        </div>
      </section>
    </>
  )
}
