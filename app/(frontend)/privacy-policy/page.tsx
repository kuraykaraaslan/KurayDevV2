import type { Metadata } from 'next'
import MetadataHelper from '@/helpers/MetadataHelper'

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

const title = 'Privacy Policy | Kuray Karaaslan'
const description =
  'Privacy Policy for kuray.dev — Learn how we collect, use, and protect your personal information.'

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  authors: [{ name: 'Kuray Karaaslan', url: `${APPLICATION_HOST}` }],
  openGraph: {
    title,
    description,
    type: 'website',
    url: `${APPLICATION_HOST}/privacy-policy`,
    images: [
      {
        url: `${APPLICATION_HOST}/assets/img/og.png`,
        width: 1200,
        height: 630,
        alt: 'Kuray Karaaslan - Privacy Policy',
      },
    ],
    locale: 'en_US',
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
  alternates: {
    canonical: `${APPLICATION_HOST}/privacy-policy`,
  },
}

const jsonLdMeta: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    url: `${APPLICATION_HOST}/privacy-policy`,
    images: [`${APPLICATION_HOST}/assets/img/og.png`],
  },
}

export default function PrivacyPolicyPage() {
  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMeta)}
      <section className="min-h-screen bg-base-100 pt-32" id="blog">
        <h1 className="text-3xl font-bold text-center mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-600 text-center mb-8">Last Updated: January 1, 2025</p>

        <div className="prose max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to <strong>kuray.dev</strong> (the &apos;Website&apos;). Your privacy is
            important to us, and this Privacy Policy explains how we collect, use, disclose, and
            protect your personal information when you visit our Website.
          </p>

          <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
          <p className="mb-4">We may collect the following types of information:</p>
          <ul className="list-disc list-inside mb-4">
            <li>
              <strong>Personal Information:</strong> Name, email address, and contact details when
              you submit forms or interact with us.
            </li>
            <li>
              <strong>Usage Data:</strong> IP addresses, browser type, pages visited, and other
              analytical data collected through cookies and similar technologies.
            </li>
            <li>
              <strong>Cookies &amp; Tracking:</strong> We use cookies to enhance your experience,
              analyze traffic, and personalize content.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">We may use the collected information for the following purposes:</p>
          <ul className="list-disc list-inside mb-4">
            <li>To provide, maintain, and improve our Website.</li>
            <li>To respond to inquiries and customer support requests.</li>
            <li>To analyze Website performance and user behavior.</li>
            <li>To comply with legal obligations.</li>
          </ul>

          <h2 className="text-xl font-semibold mb-4">4. How We Share Your Information</h2>
          <p className="mb-4">
            We do not sell or rent your personal information. However, we may share data with:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>
              <strong>Service Providers:</strong> Third-party services that help us operate and
              maintain the Website.
            </li>
            <li>
              <strong>Legal Authorities:</strong> When required by law or to protect our rights.
            </li>
            <li>
              <strong>Business Transfers:</strong> If we undergo a business transaction such as a
              merger or acquisition.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mb-4">5. Cookies and Tracking Technologies</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to enhance user experience. You can
            control cookie settings through your browser preferences.
          </p>

          <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
          <p className="mb-4">
            We implement security measures to protect your data. However, no online platform is 100%
            secure, so use the Website at your own risk.
          </p>

          <h2 className="text-xl font-semibold mb-4">7. Your Rights and Choices</h2>
          <p className="mb-4">
            Depending on your location, you may have rights to access, correct, or delete your
            personal data. To request changes, please contact us.
          </p>

          <h2 className="text-xl font-semibold mb-4">8. Third-Party Links</h2>
          <p className="mb-4">
            Our Website may contain links to third-party sites. We are not responsible for their
            privacy practices, so review their policies separately.
          </p>

          <h2 className="text-xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. Any changes will be posted on this
            page with the updated date.
          </p>

          <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
          <p className="mb-4">
            If you have any questions or concerns about this Privacy Policy, please contact us at:
            <br />
            <strong>Email:</strong> support@kuray.dev
            <br />
            <strong>Website:</strong> kuray.dev
          </p>
        </div>
      </section>
    </>
  )
}
