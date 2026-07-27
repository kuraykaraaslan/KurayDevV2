/**
 * Seed the About / Contact / Terms DynamicPage entries so they're reachable at
 * /about, /contact, /terms (via the [dynamicSlugA] route) and indexable via
 * the sitemap. Re-run anytime — uses upsert.
 *
 *   npx tsx scripts/seed-static-dynamic-pages.ts
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

type PageSeed = {
  slug: string
  title: string
  description: string
  keywords: string[]
  sections: Array<{ id: string; type: string; order: number; props: Record<string, unknown> }>
}

const PAGES: PageSeed[] = [
  {
    slug: 'about',
    title: 'About',
    description:
      'Kuray Karaaslan — Software Architect & Product Engineer, also working as a BIM developer and IoT developer. Background, experience, and tech stack.',
    keywords: [
      'kuray karaaslan',
      'about',
      'software architect',
      'bim developer',
      'iot developer',
      'biography',
      'experience',
      'react developer',
      'java spring boot',
    ],
    sections: [
      {
        id: 'about-hero',
        type: 'AboutHeroBlock',
        order: 0,
        props: {
          headlineLines: [
            { text: 'Software Architect.' },
            { text: 'BIM & IoT Developer.' },
            { text: 'Available for Freelance.' },
          ],
          paragraphs: [
            {
              text: "I'm Kuray Karaaslan, a software architect and product engineer designing production-grade SaaS, integration, and real-time platforms — from architecture and backend through frontend and infrastructure.",
            },
            {
              text: 'I also work as a BIM developer, automating Building Information Modeling workflows on Autodesk Revit, AutoCAD, Robot Structural Analysis, and Advance Steel, and building API-driven automation tools in C# and PHP REST APIs.',
            },
            {
              text: 'As an IoT developer, I build device-to-server communication systems over MQTT, WebSocket, and SNMP, paired with Java Spring and TypeScript/React for real-time telemetry and control.',
            },
            {
              text: 'Alongside software, I have hands-on experience as an independent construction engineer and contractor, which keeps my BIM work grounded in real structural and site practice rather than just tooling.',
            },
            {
              text: 'My stack spans React, Next.js, React Native, Node.js, Java Spring Boot, PostgreSQL, and Redis. I focus on multi-tenant architectures, clean code, and pragmatic delivery.',
            },
            {
              text: "I'm based in Turkey and work remotely with teams worldwide.",
            },
          ],
          ctaLabel: 'Get in touch',
          ctaHref: '/contact',
          imageAlt: 'Kuray Karaaslan',
          sectionId: 'about',
        },
      },
      {
        id: 'about-toolbox',
        type: 'HeroToolboxLiveBlock',
        order: 1,
        props: {},
      },
      {
        id: 'about-git',
        type: 'GitContributionsBlock',
        order: 2,
        props: {},
      },
      {
        id: 'about-faq',
        type: 'FAQBlock',
        order: 3,
        props: {
          heading: 'Frequently Asked Questions',
          subtitle: 'Common questions about my background and work',
          faqs: [
            {
              question: 'Is Kuray Karaaslan a BIM developer?',
              answer:
                'Yes. Alongside software architecture, I work as a BIM developer, automating Building Information Modeling workflows on Autodesk Revit, AutoCAD, Robot Structural Analysis, and Advance Steel.',
            },
            {
              question: 'Does Kuray Karaaslan do IoT development?',
              answer:
                'Yes. As an IoT developer, I build device-to-server communication systems over MQTT, WebSocket, and SNMP, paired with Java Spring and TypeScript/React for real-time telemetry.',
            },
            {
              question: 'Which BIM tools does he know?',
              answer:
                'Autodesk Revit, AutoCAD, Robot Structural Analysis, and Advance Steel, with API-driven automation built in C# and PHP REST APIs.',
            },
            {
              question: 'Which IoT protocols does he use?',
              answer: 'MQTT, WebSocket, and SNMP, backed by a Java Spring ingestion/rules layer and a TypeScript/React real-time dashboard.',
            },
            {
              question: 'Does he have hands-on construction engineering experience?',
              answer:
                'Yes — independent construction engineer and contractor experience, which keeps his BIM work grounded in real structural and site practice rather than just tooling.',
            },
          ],
          blockClass: 'bg-base-100 py-20 px-6 md:px-12 lg:px-20',
          sectionId: 'faq',
        },
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    description:
      'Get in touch with Kuray Karaaslan for freelance work, collaboration, or technical consulting. Email, LinkedIn, and contact form.',
    keywords: ['contact', 'kuray karaaslan', 'freelance', 'hire developer', 'get in touch'],
    sections: [
      {
        id: 'contact-form',
        type: 'ContactFormBlock',
        order: 0,
        props: {},
      },
      {
        id: 'contact-methods',
        type: 'ContactMethodsBlock',
        order: 1,
        props: {},
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    description:
      'Terms of use for kuray.dev. By using this site, you agree to the following conditions on content, intellectual property, and disclaimers.',
    keywords: ['terms', 'terms of use', 'legal', 'kuray karaaslan'],
    sections: [
      {
        id: 'terms-body',
        type: 'TextImageBlock',
        order: 0,
        props: {
          title: 'Terms of Use',
          body: [
            'By accessing kuray.dev you agree to these terms. All content (text, code samples, images) is the intellectual property of Kuray Karaaslan unless otherwise noted. Code snippets published on the blog are released under the MIT license unless explicitly stated.',
            'Information on this site is provided "as is" with no warranty. Kuray Karaaslan is not liable for any loss or damage arising from use of this content.',
            'These terms may be updated without notice. Continued use after changes constitutes acceptance.',
          ].join('\n\n'),
        },
      },
    ],
  },
]

async function main() {
  for (const seed of PAGES) {
    const page = await prisma.dynamicPage.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        description: seed.description,
        keywords: seed.keywords,
        sections: seed.sections as any,
        status: 'PUBLISHED',
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        description: seed.description,
        keywords: seed.keywords,
        sections: seed.sections as any,
        status: 'PUBLISHED',
      },
    })
    console.log(`Upserted DynamicPage /${seed.slug} (id: ${page.dynamicPageId})`)
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
