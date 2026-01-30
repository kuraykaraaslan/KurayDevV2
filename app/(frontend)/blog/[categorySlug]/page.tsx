import Newsletter from '@/components/frontend/Features/Newsletter';
import Feed from '@/components/frontend/Features/Blog/Feed';
import { Category } from '@/types/content/BlogTypes';
import CategoryService from '@/services/CategoryService';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import MetadataHelper from '@/helpers/MetadataHelper';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

type Props = {
    params: Promise<{ categorySlug: string }>;
};

async function getCategory(categorySlug: string) {
    return await CategoryService.getCategoryBySlug(categorySlug) as Category | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { categorySlug } = await params;
    const category = await getCategory(categorySlug);

    if (!category) {
        return {};
    }

    const url = `${APPLICATION_HOST}/blog/${category.slug}`;
    const description = category.description || `Discover posts in the ${category.title} category.`;
    const image = category.image || `${APPLICATION_HOST}/assets/img/og.png`;

    return {
        title: `${category.title} | Kuray Karaaslan`,
        description,
        openGraph: {
            title: `${category.title} | Kuray Karaaslan`,
            description,
            type: 'website',
            url,
            images: [{ url: image, width: 1200, height: 630, alt: category.title }],
            locale: 'en_US',
            siteName: 'Kuray Karaaslan',
        },
        twitter: {
            card: 'summary_large_image',
            site: '@kuraykaraaslan',
            creator: '@kuraykaraaslan',
            title: `${category.title} | Kuray Karaaslan`,
            description,
            images: [image],
        },
        alternates: {
            canonical: url,
        },
    };
}

export default async function CategoryPage({ params }: Props) {
    try {
        const { categorySlug } = await params;

        if (!categorySlug) {
            notFound();
        }

        const category = await getCategory(categorySlug);

        if (!category) {
            notFound();
        }

        const url = `${APPLICATION_HOST}/blog/${category.slug}`;

        // Metadata for JSON-LD
        const metadata: Metadata = {
            title: `${category.title} | Kuray Karaaslan`,
            description: category.description || `Discover posts in the ${category.title} category.`,
            openGraph: {
                title: `${category.title} | Kuray Karaaslan`,
                description: category.description || `Explore all articles in the ${category.title} category.`,
                type: 'website',
                url,
                images: [category.image || `${APPLICATION_HOST}/assets/img/og.png`],
            },
        };

        // Breadcrumbs for SEO
        const breadcrumbs = [
            { name: 'Home', url: `${APPLICATION_HOST}/` },
            { name: 'Blog', url: `${APPLICATION_HOST}/blog` },
            { name: category.title, url },
        ];

        return (
            <>
                {MetadataHelper.generateJsonLdScripts(metadata, { breadcrumbs })}
                <Feed category={category} />
                <Newsletter />
            </>
        );

    } catch (error) {
        console.error('Error fetching category:', error);
        notFound();
    }
}
