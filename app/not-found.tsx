import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Kuray Karaaslan',
  robots: {
    index: false,
    follow: false,
  },
}

const NotFoundPage = () => {
  return (
    <section className="h-screen flex items-center justify-center bg-base-100">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary">
            404
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold md:text-4xl">
            Something&apos;s missing.
          </p>
          <p className="mb-4 text-lg font-light">
            Sorry, we can&apos;t find that page. You&apos;ll find lots to explore on the home
            page.{' '}
          </p>
          <Link
            href="/"
            className="px-6 py-3 text-lg font-medium text-white bg-primary rounded-md mt-8"
          >
            Go Home
          </Link>
        </div>
      </div>
    </section>
  )
}

export default NotFoundPage
