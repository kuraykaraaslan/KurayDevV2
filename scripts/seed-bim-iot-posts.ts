/**
 * Seed two case-study blog posts — one for the "bim" category, one for "iot" —
 * so the site has real, crawlable, quotable content behind the "BIM developer"
 * and "IoT developer" positioning. Re-run anytime — uses upsert.
 *
 * Run `npx tsx scripts/seed-bim-iot-categories.ts` first (creates the categories
 * these posts attach to).
 *
 *   npx tsx scripts/seed-bim-iot-posts.ts
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

type PostSeed = {
  slug: string
  categorySlug: string
  title: string
  description: string
  keywords: string[]
  content: string
}

const POSTS: PostSeed[] = [
  {
    slug: 'bim-automation-to-software-architecture',
    categorySlug: 'bim',
    title: 'From BIM Automation to Software Architecture: What a Revit API Pipeline Taught Me About Systems Design',
    description:
      'Notes from working as a BIM developer — automating Revit, AutoCAD, and Advance Steel workflows with a C#/PHP REST API pipeline, and how that shaped my approach to software architecture.',
    keywords: [
      'bim developer',
      'revit api',
      'autodesk',
      'advance steel',
      'bim automation',
      'building information modeling',
      'software architecture',
    ],
    content: `
<p>Before most of my work was pure software architecture, I spent a substantial stretch of time as a <strong>BIM developer</strong> — automating Building Information Modeling workflows on <strong>Autodesk Revit, AutoCAD, Robot Structural Analysis, and Advance Steel</strong>. That work left a permanent mark on how I think about systems design, and it's a big part of why I still describe myself as a BIM developer alongside "software architect."</p>

<h2>The problem: models as the source of truth</h2>
<p>In a BIM workflow, the model is not documentation — it <em>is</em> the system of record. Structural, architectural, and MEP disciplines all read and write against the same model, and any automation layered on top has to respect that model's integrity or it silently corrupts downstream drawings, quantities, and fabrication data. That constraint — "never let automation drift from the source of truth" — turned out to be exactly the same discipline that matters in multi-tenant SaaS: the database is the model, and every integration has to respect it the same way.</p>

<h2>The pipeline</h2>
<p>The automation itself was built around the <strong>Autodesk Revit and Advance Steel APIs</strong>, driven from custom <strong>C#</strong> add-ins for in-application automation and a <strong>PHP REST API</strong> layer for external orchestration — batch processing, validation rules, and exporting structured data out of the model for reporting. The interesting engineering problem wasn't the API calls themselves; it was designing an automation layer that could run unattended against a live, mutable model without ever leaving it in an inconsistent state — the same class of problem as building idempotent jobs against a production database.</p>

<h2>What carried over into software architecture</h2>
<ul>
<li><strong>Domain correctness over convenience.</strong> In BIM, cutting a corner on model integrity shows up as a fabrication error weeks later. That's the same lesson multi-tenant SaaS teaches with data isolation — the cost of a shortcut is deferred, not avoided.</li>
<li><strong>Automation as a first-class citizen, not a script.</strong> Treating the Revit/Advance Steel automation as real software — versioned, testable, observable — rather than a one-off macro is what made it survivable long-term.</li>
<li><strong>Translating domain workflows into execution models.</strong> BIM automation is fundamentally about translating an engineering workflow into something a machine can execute reliably. That's the exact same skill I now apply translating business/product workflows into architecture.</li>
</ul>

<p>I still pick up BIM developer work when it involves this kind of automation — Revit/Advance Steel API integrations, model validation tooling, or bridging BIM data into web platforms — because the underlying discipline is identical to the software architecture work I do the rest of the time.</p>
`.trim(),
  },
  {
    slug: 'real-time-iot-telemetry-mqtt-snmp-websocket',
    categorySlug: 'iot',
    title: 'Building Real-Time IoT Telemetry: MQTT, SNMP, and WebSocket Architecture Notes',
    description:
      'Architecture notes from working as an IoT developer on device-to-server telemetry systems — MQTT, SNMP, and WebSocket, backed by Java Spring and a TypeScript/React front end.',
    keywords: [
      'iot developer',
      'mqtt',
      'snmp',
      'websocket',
      'telemetry',
      'real-time systems',
      'java spring',
    ],
    content: `
<p>A meaningful part of my work as an <strong>IoT developer</strong> has been building the communication layer between physical devices and backend servers — the unglamorous plumbing that everything else in an IoT product depends on. These are notes on how that layer is actually put together.</p>

<h2>Three protocols, three jobs</h2>
<p>Real IoT deployments rarely use one protocol; they use whichever protocol fits the job:</p>
<ul>
<li><strong>MQTT</strong> for lightweight, publish/subscribe device telemetry — low overhead, works well on constrained networks, and maps naturally onto a topic-per-device (or topic-per-sensor) hierarchy.</li>
<li><strong>SNMP</strong> for polling and monitoring network-attached hardware that already speaks it natively — common in industrial and networking-adjacent deployments where the device firmware isn't something you control.</li>
<li><strong>WebSocket</strong> for pushing live telemetry and control state to the browser — the last mile between the backend and a real-time dashboard, where MQTT and SNMP aren't directly consumable by a web client.</li>
</ul>
<p>The architectural work is less about any single protocol and more about the translation layer that normalizes all three into one internal event model, so the rest of the system — storage, rules, dashboards — doesn't need to know or care which protocol a given device speaks.</p>

<h2>Backend: Java Spring as the ingestion and rules layer</h2>
<p>On the server side, a <strong>Java Spring</strong> service handles connection management, message ingestion, and the rule engine that turns raw telemetry into meaningful events — threshold alerts, state transitions, aggregations. Keeping ingestion and rules decoupled from the device-facing protocol adapters is what lets new device types get onboarded without touching the core pipeline.</p>

<h2>Frontend: TypeScript/React over WebSocket</h2>
<p>The dashboard side is a <strong>TypeScript/React</strong> application consuming a WebSocket stream for live updates, with the same event model driving both real-time views and historical charts. The main design pressure here is backpressure and reconnection handling — a dashboard has to degrade gracefully when a device (or the network) goes quiet, not just freeze on stale data.</p>

<h2>The recurring lesson</h2>
<p>Across MQTT, SNMP, and WebSocket, the hard part is never the protocol — it's designing a system that treats "device went offline" and "device is sending garbage" as first-class, expected states rather than exceptions. That mindset — build for the unreliable case as the normal case — is, I'd argue, the single most transferable lesson from IoT developer work into any other kind of distributed systems architecture.</p>
`.trim(),
  },
]

async function main() {
  const author = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!author) {
    throw new Error('No user found. Create an admin user before seeding posts.')
  }

  for (const seed of POSTS) {
    const category = await prisma.category.findFirst({ where: { slug: seed.categorySlug } })
    if (!category) {
      throw new Error(
        `Category "${seed.categorySlug}" not found. Run "npx tsx scripts/seed-bim-iot-categories.ts" first.`
      )
    }

    const post = await prisma.post.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        description: seed.description,
        keywords: seed.keywords,
        content: seed.content,
        categoryId: category.categoryId,
        status: 'PUBLISHED',
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        description: seed.description,
        keywords: seed.keywords,
        content: seed.content,
        categoryId: category.categoryId,
        authorId: author.userId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    console.log(`Upserted Post /blog/${seed.categorySlug}/${seed.slug} (id: ${post.postId})`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
