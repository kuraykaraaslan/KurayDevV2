/**
 * Seed the "bim" and "iot" blog Category rows so /blog/bim and /blog/iot
 * become real, crawlable hub pages for BIM-developer / IoT-developer content.
 * Re-run anytime — uses upsert.
 *
 *   npx tsx scripts/seed-bim-iot-categories.ts
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

type CategorySeed = {
  slug: string
  title: string
  description: string
  keywords: string[]
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'bim',
    title: 'BIM',
    description:
      'Notes from working as a BIM developer — Building Information Modeling automation on Autodesk Revit, AutoCAD, Robot Structural Analysis, and Advance Steel, with API-driven tooling in C# and PHP REST APIs.',
    keywords: [
      'bim',
      'bim developer',
      'building information modeling',
      'revit api',
      'autodesk',
      'autocad',
      'advance steel',
      'bim automation',
    ],
  },
  {
    slug: 'iot',
    title: 'IoT',
    description:
      'Notes from working as an IoT developer — real-time device-to-server communication with MQTT, WebSocket, and SNMP, and telemetry systems built with Java Spring and TypeScript/React.',
    keywords: [
      'iot',
      'iot developer',
      'internet of things',
      'mqtt',
      'websocket',
      'snmp',
      'telemetry',
      'real-time systems',
    ],
  },
]

async function main() {
  for (const seed of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        description: seed.description,
        keywords: seed.keywords,
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        description: seed.description,
        keywords: seed.keywords,
      },
    })
    console.log(`Upserted Category /blog/${seed.slug} (id: ${category.categoryId})`)
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
