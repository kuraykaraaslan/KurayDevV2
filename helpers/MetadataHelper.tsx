import { Metadata } from 'next';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

export default class MetadataHelper {

    // Supported languages
    static readonly SUPPORTED_LANGUAGES = ['en', 'tr', 'de', 'nl', 'gr', 'mt', 'th', 'et', 'uk'];

    // Generate JSON-LD for Organization
    public static getOrganizationJsonLd() {
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Kuray Karaaslan",
            "url": APPLICATION_HOST,
            "logo": `${APPLICATION_HOST}/assets/img/og.png`,
            "sameAs": [
                "https://github.com/kuraykaraaslan",
                "https://twitter.com/kuraykaraaslan",
                "https://www.linkedin.com/in/kuraykaraaslan/"
            ]
        };
    }

    // Generate JSON-LD for Article
    public static getArticleJsonLd(meta: Metadata, post?: any) {
        if (!meta?.openGraph?.url || !/\/blog\//.test(String(meta.openGraph.url))) return null;
        const title = meta?.title || 'Kuray Karaaslan';
        const description = meta?.description || 'Software developer, tech blogger, and open-source enthusiast.';
        const url = meta?.openGraph?.url || APPLICATION_HOST || '';
        // Helper to extract image URL as string
        function getImageUrl(img: any): string {
            if (!img) return `${APPLICATION_HOST}/assets/img/og.png`;
            if (typeof img === 'string') return img;
            if (typeof img === 'object' && 'url' in img) return String(img.url);
            return String(img);
        }
        let images: string[] = [];
        if (Array.isArray(meta?.openGraph?.images)) {
            images = meta.openGraph.images.map(getImageUrl);
        } else if (meta?.openGraph?.images) {
            images = [getImageUrl(meta.openGraph.images)];
        } else {
            images = [`${APPLICATION_HOST}/assets/img/og.png`];
        }
        const image = images[0];

        // Calculate word count from content
        const wordCount = post?.content
            ? post.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter((word: string) => word.length > 0).length
            : undefined;

        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "image": image,
            "datePublished": post?.createdAt ? new Date(post.createdAt).toISOString() : undefined,
            "dateModified": post?.updatedAt ? new Date(post.updatedAt).toISOString() : (post?.createdAt ? new Date(post.createdAt).toISOString() : undefined),
            "wordCount": wordCount,
            "articleSection": post?.category?.name || "Technology",
            "keywords": post?.keywords || [],
            "author": {
                "@type": "Person",
                "name": "Kuray Karaaslan",
                "url": `${APPLICATION_HOST}/about`
            },
            "publisher": {
                "@type": "Organization",
                "name": "Kuray Karaaslan",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${APPLICATION_HOST}/assets/img/og.png`
                }
            },
            "mainEntityOfPage": url,
            "url": url
        };
    }

    // Generate hreflang tags for multi-language SEO
    public static generateHreflangTags(currentUrl: string) {
        const pathname = currentUrl.replace(APPLICATION_HOST || '', '');

        return MetadataHelper.SUPPORTED_LANGUAGES.map(lang => (
            <link
                key={`hreflang-${lang}`}
                rel="alternate"
                hrefLang={lang}
                href={`${APPLICATION_HOST}/${lang}${pathname}`}
            />
        ));
    }

    public static generateElements(meta: Metadata, post?: any) {
        // Fallbacks
        const title = meta?.title || 'Kuray Karaaslan';
        const description = meta?.description || 'Software developer, tech blogger, and open-source enthusiast.';
        const url = meta?.openGraph?.url || APPLICATION_HOST || '';

        // Helper to extract image URL as string
        function getImageUrl(img: any): string {
            if (!img) return `${APPLICATION_HOST}/assets/img/og.png`;
            if (typeof img === 'string') return img;
            if (typeof img === 'object' && 'url' in img) return String(img.url);
            return String(img);
        }

        let images: string[] = [];
        if (Array.isArray(meta?.openGraph?.images)) {
            images = meta.openGraph.images.map(getImageUrl);
        } else if (meta?.openGraph?.images) {
            images = [getImageUrl(meta.openGraph.images)];
        } else {
            images = [`${APPLICATION_HOST}/assets/img/og.png`];
        }

        // Dynamic og:type based on URL pattern only
        let ogType = 'website';
        if (meta?.openGraph?.url && /\/blog\//.test(String(meta.openGraph.url))) {
            ogType = 'article';
        }

        // Canonical tag
        const canonicalUrl = url;

        // JSON-LD
        const orgJsonLd = MetadataHelper.getOrganizationJsonLd();
        const articleJsonLd = MetadataHelper.getArticleJsonLd(meta, post);

        return (
            <>
                <title>{String(title)}</title>
                <meta name="description" content={String(description)} />
                <link rel="canonical" href={String(canonicalUrl)} />
                <meta property="og:title" content={String(meta?.openGraph?.title || title)} />
                <meta property="og:image" content={images[0]} />
                <meta property="og:description" content={String(meta?.openGraph?.description || description)} />
                <meta property="og:type" content={ogType} />
                <meta property="og:url" content={String(url)} />
                <meta property="og:locale" content="en_US" />

                {/* Article-specific OG tags */}
                {ogType === 'article' && post && (
                    <>
                        <meta property="article:published_time" content={new Date(post.createdAt).toISOString()} />
                        <meta property="article:modified_time" content={new Date(post.updatedAt || post.createdAt).toISOString()} />
                        <meta property="article:author" content="Kuray Karaaslan" />
                        <meta property="article:section" content={post.category?.name || "Technology"} />
                        {post.keywords?.map((keyword: string) => (
                            <meta key={keyword} property="article:tag" content={keyword} />
                        ))}
                    </>
                )}

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@kuraykaraaslan" />
                <meta name="twitter:creator" content="@kuraykaraaslan" />
                <meta name="twitter:title" content={String(title)} />
                <meta name="twitter:description" content={String(description)} />
                <meta name="twitter:image" content={images[0]} />

                {/* Basic SEO Meta Tags */}
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
                <meta name="author" content="Kuray Karaaslan" />
                <meta name="theme-color" content="#000000" />

                {/* Hreflang tags for multi-language SEO */}
                {MetadataHelper.generateHreflangTags(String(url))}
                <link rel="alternate" hrefLang="x-default" href={String(url)} />

                {/* JSON-LD Structured Data */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
                {articleJsonLd && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
                )}
            </>
        );
    }

}