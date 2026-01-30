import Newsletter from '@/components/frontend/Features/Newsletter';
import Feed from '@/components/frontend/Features/Blog/Feed';
import CategoryBullets from '@/components/frontend/Features/CategoryBullets';
import type { Metadata } from 'next';
import MetadataHelper from '@/helpers/MetadataHelper';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

const description = 'Welcome to my tech blog! I\'m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel.';

export const metadata: Metadata = {
    title: 'Blog | Kuray Karaaslan',
    description,
    openGraph: {
        title: 'Blog | Kuray Karaaslan',
        description,
        type: 'website',
        url: `${APPLICATION_HOST}/blog`,
        images: [{ url: `${APPLICATION_HOST}/assets/img/og.png`, width: 1200, height: 630, alt: 'Kuray Karaaslan Blog' }],
        locale: 'en_US',
        siteName: 'Kuray Karaaslan',
    },
    twitter: {
        card: 'summary_large_image',
        site: '@kuraykaraaslan',
        creator: '@kuraykaraaslan',
        title: 'Blog | Kuray Karaaslan',
        description,
        images: [`${APPLICATION_HOST}/assets/img/og.png`],
    },
    alternates: {
        canonical: `${APPLICATION_HOST}/blog`,
    },
};

const BlogPage = () => {
    // Metadata for JSON-LD only (meta tags handled by export above)
    const jsonLdMetadata: Metadata = {
        title: 'Blog | Kuray Karaaslan',
        description,
        openGraph: {
            title: 'Blog | Kuray Karaaslan',
            description,
            type: 'website',
            url: `${APPLICATION_HOST}/blog`,
            images: [`${APPLICATION_HOST}/assets/img/og.png`],
        },
    };

    const breadcrumbs = [
        { name: 'Home', url: `${APPLICATION_HOST}/` },
        { name: 'Blog', url: `${APPLICATION_HOST}/blog` },
    ];

    return (
        <>
            {MetadataHelper.generateJsonLdScripts(jsonLdMetadata, { breadcrumbs })}
            <Feed />
            <CategoryBullets />
            <Newsletter />
        </>
    );
};

export default BlogPage;
