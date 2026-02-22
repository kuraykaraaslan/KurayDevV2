import type { Metadata } from 'next'

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

export const metadata: Metadata = {
  title: 'Now | Kuray Karaaslan',
  description: 'What Kuray Karaaslan is focused on right now.',
  openGraph: {
    title: 'Now | Kuray Karaaslan',
    description: 'What Kuray Karaaslan is focused on right now.',
    type: 'website',
    url: `${APPLICATION_HOST}/now`,
    images: [`${APPLICATION_HOST}/assets/img/og.png`],
  },
  alternates: {
    canonical: `${APPLICATION_HOST}/now`,
  },
}

export default function NowPage() {
  return (
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
                Working as a Software Developer at <strong>Roltek Technology</strong>. Day to day I build communication infrastructure between IoT devices and servers using MQTT, WebSocket, and REST. Backend is Java Spring, frontend is TypeScript + React.
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
                Actively developing <strong>kuray.dev</strong> — this site. It started as a simple blog and has grown into a full-stack platform with a CMS, appointment booking, analytics, and more. Built with Next.js, PostgreSQL, and a bunch of things I wanted to learn by actually building them.
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
                Based in İzmir. Trying to get outside more, go for runs, and spend less time doom-scrolling. Some days go better than others.
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
  )
}
