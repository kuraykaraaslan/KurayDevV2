import { Metadata } from 'next';
import React from 'react';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

export default function TermsPage() {

  const meta = generateMetadata();

  return (
    <>
      {generateMetadataElement(meta)}
      <section className="min-h-screen bg-base-100 pt-32" id="blog">
        <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col max-w-none">
          <h1 className="text-3xl font-bold text-center mb-6">Terms of Use</h1>
          <p className="text-sm text-gray-600 text-center mb-8">
            Last Updated: September 1, 2023
          </p>

          <div className="prose max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to <strong>kuray.dev</strong> (the "Website"), operated by Kuray Karaaslan ("we," "us," or "our"). By accessing or using this Website, you agree to comply with and be bound by the following terms and conditions of use. If you do not agree to these terms, please do not use this Website.
            </p>

            <h2 className="text-xl font-semibold mb-4">2. Intellectual Property</h2>
            <p className="mb-4">
              All content on this Website, including but not limited to text, graphics, logos, images, and software, is the property of Kuray Karaaslan or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works from any content without our prior written consent.
            </p>

            <h2 className="text-xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="mb-4">
              By using this Website, you agree to:
              <ul className="list-disc list-inside">
                <li>Use the Website only for lawful purposes.</li>
                <li>Not engage in any activity that disrupts or interferes with the Website's functionality.</li>
                <li>Not attempt to gain unauthorized access to any part of the Website or its systems.</li>
              </ul>
            </p>

            <h2 className="text-xl font-semibold mb-4">4. Limitation of Liability</h2>
            <p className="mb-4">
              We are not liable for any damages arising out of or related to your use of this Website. This includes, but is not limited to, direct, indirect, incidental, or consequential damages.
            </p>

            <h2 className="text-xl font-semibold mb-4">5. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Any changes will be effective immediately upon posting on this Website. Your continued use of the Website after changes are posted constitutes your acceptance of the revised terms.
            </p>

            <h2 className="text-xl font-semibold mb-4">6. Governing Law</h2>
            <p className="mb-4">
              These terms are governed by and construed in accordance with the laws of [Insert Jurisdiction]. Any disputes arising from these terms or your use of the Website will be subject to the exclusive jurisdiction of the courts of [Insert Jurisdiction].
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
  );
}

function generateMetadata(): Metadata {
  return {
    title: `Terms of Use | Kuray Karaaslan`,
    description: "Terms of Use for Kuray Karaaslan",
    openGraph: {
      title: `Terms of Use | Kuray Karaaslan`,
      description: "Terms of Use for Kuray Karaaslan",
      type: 'article',
      url: `${APPLICATION_HOST}/terms`,
      images: [`${APPLICATION_HOST}/assets/img/default.jpg`],
    },
  };
}

function generateMetadataElement(meta: Metadata) {

  console.log('meta', meta);
  return (
    <>
      <title>{String(meta?.title)}</title>
      <meta name="description" content={String(meta?.description)} />
      <meta property="og:title" content={String(meta?.openGraph?.title)} />
      <meta property="og:description" content={String(meta?.openGraph?.description)} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={String(meta?.openGraph?.url)} />
      <meta property="og:image" content={Array.isArray(meta?.openGraph?.images) ? String(meta?.openGraph?.images?.[0]) : String(meta?.openGraph?.images)} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@dropshoptickets" />
      <meta name="twitter:creator" content="@dropshoptickets" />
      <meta name="twitter:title" content={String(meta?.title)} />
      <meta name="twitter:description" content={String(meta?.description)} />
      <meta name="twitter:image" content={Array.isArray(meta?.openGraph?.images) ? String(meta?.openGraph?.images?.[0]) : String(meta?.openGraph?.images)} />
    </>
  );
}