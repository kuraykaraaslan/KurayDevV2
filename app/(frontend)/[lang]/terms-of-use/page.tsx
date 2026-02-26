import type { Metadata } from 'next'
import MetadataHelper from '@/helpers/MetadataHelper'
import { getPageMetadata } from '@/libs/localize/getDictionary'
import { buildAlternates, getOgLocale } from '@/helpers/HreflangHelper'
import { AVAILABLE_LANGUAGES } from '@/types/common/I18nTypes'

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const { canonical, languages } = buildAlternates(lang, '/terms-of-use', [...AVAILABLE_LANGUAGES])
  const { title, description, keywords } = await getPageMetadata(lang, 'terms_of_use')

  return {
    title,
    description,
    keywords,
    robots: { index: true, follow: true },
    authors: [{ name: 'Kuray Karaaslan', url: `${APPLICATION_HOST}` }],
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [
        {
          url: `${APPLICATION_HOST}/assets/img/og.png`,
          width: 1200,
          height: 630,
          alt: 'Kuray Karaaslan - Terms of Use',
        },
      ],
      locale: getOgLocale(lang),
      siteName: 'Kuray Karaaslan',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@kuraykaraaslan',
      creator: '@kuraykaraaslan',
      title,
      description,
      images: [`${APPLICATION_HOST}/assets/img/og.png`],
    },
    alternates: { canonical, languages },
  }
}

export default async function TermsPage({ params }: Props) {
  const { lang } = await params
  const { title, description } = await getPageMetadata(lang, 'terms_of_use')

  const jsonLdMeta: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${APPLICATION_HOST}/terms-of-use`,
      images: [`${APPLICATION_HOST}/assets/img/og.png`],
    },
  }

  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMeta)}
      <section className="min-h-screen bg-base-100 pt-32" id="blog">
        <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col max-w-none">
          <h1 className="text-3xl font-bold text-center mb-6">Terms of Use</h1>
          <p className="text-sm text-gray-600 text-center mb-8">Last Updated: September 1, 2023</p>

          <div className="prose max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to <strong>kuray.dev</strong> (the &apos;Website&apos;), operated by Kuray
              Karaaslan (&apos;we,&apos; &apos;us,&apos; or &apos;our&apos;). By accessing or using
              this Website, you agree to comply with and be bound by the following terms and
              conditions of use. If you do not agree to these terms, please do not use this Website.
            </p>

            <h2 className="text-xl font-semibold mb-4">2. Intellectual Property</h2>
            <p className="mb-4">
              All content on this Website, including but not limited to text, graphics, logos,
              images, and software, is the property of Kuray Karaaslan or its licensors and is
              protected by intellectual property laws. You may not reproduce, distribute, or create
              derivative works from any content without our prior written consent.
            </p>

            <h2 className="text-xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="mb-4">
              By using this Website, you agree to:
              <ul className="list-disc list-inside">
                <li>Use the Website only for lawful purposes.</li>
                <li>
                  Not engage in any activity that disrupts or interferes with the Website&apos;s
                  functionality.
                </li>
                <li>
                  Not attempt to gain unauthorized access to any part of the Website or its systems.
                </li>
              </ul>
            </p>

            <h2 className="text-xl font-semibold mb-4">4. Limitation of Liability</h2>
            <p className="mb-4">
              We are not liable for any damages arising out of or related to your use of this
              Website. This includes, but is not limited to, direct, indirect, incidental, or
              consequential damages.
            </p>

            <h2 className="text-xl font-semibold mb-4">5. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Any changes will be effective
              immediately upon posting on this Website. Your continued use of the Website after
              changes are posted constitutes your acceptance of the revised terms.
            </p>

            <h2 className="text-xl font-semibold mb-4">6. Governing Law</h2>
            <p className="mb-4">
              These terms are governed by and construed in accordance with the laws of Turkey. Any
              disputes arising from these terms or your use of the Website will be subject to the
              exclusive jurisdiction of the courts of Turkey.
            </p>

            <h2 className="text-xl font-semibold mb-4">7. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these terms, please contact us at:
              <br />
              <strong>Email:</strong> info@kuray.dev
              <br />
              <strong>Website:</strong> kuray.dev
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
