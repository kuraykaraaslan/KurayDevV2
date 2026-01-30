import { Metadata } from 'next';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

export default class MetadataHelper {

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

    // Generate JSON-LD for Article with optional date information
    public static getArticleJsonLd(meta: Metadata, articleData?: {
        datePublished?: string;
        dateModified?: string;
        authorName?: string;
        articleSection?: string;
        keywords?: string[];
        wordCount?: number;
    }) {
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

        const jsonLd: Record<string, any> = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "image": image,
            "author": {
                "@type": "Person",
                "name": articleData?.authorName || "Kuray Karaaslan",
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

        if (articleData?.datePublished) {
            jsonLd["datePublished"] = articleData.datePublished;
        }
        if (articleData?.dateModified) {
            jsonLd["dateModified"] = articleData.dateModified;
        } else if (articleData?.datePublished) {
            jsonLd["dateModified"] = articleData.datePublished;
        }
        if (articleData?.articleSection) {
            jsonLd["articleSection"] = articleData.articleSection;
        }
        if (articleData?.keywords?.length) {
            jsonLd["keywords"] = articleData.keywords;
        }
        if (articleData?.wordCount) {
            jsonLd["wordCount"] = articleData.wordCount;
        }

        return jsonLd;
    }

    // Generate JSON-LD for Breadcrumb
    public static getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url
            }))
        };
    }

    // Generate only JSON-LD scripts (for use with Next.js generateMetadata)
    public static generateJsonLdScripts(
        meta: Metadata,
        options?: {
            articleData?: {
                datePublished?: string;
                dateModified?: string;
                authorName?: string;
                articleSection?: string;
                keywords?: string[];
                wordCount?: number;
            };
            breadcrumbs?: { name: string; url: string }[];
        }
    ) {
        const orgJsonLd = MetadataHelper.getOrganizationJsonLd();
        const articleJsonLd = MetadataHelper.getArticleJsonLd(meta, options?.articleData);
        const breadcrumbJsonLd = options?.breadcrumbs ? MetadataHelper.getBreadcrumbJsonLd(options.breadcrumbs) : null;

        return (
            <>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
                {articleJsonLd && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
                )}
                {breadcrumbJsonLd && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
                )}
            </>
        );
    }

    public static generateElements(
        meta: Metadata,
        options?: {
            articleData?: {
                datePublished?: string;
                dateModified?: string;
                authorName?: string;
                articleSection?: string;
                keywords?: string[];
                wordCount?: number;
            };
            breadcrumbs?: { name: string; url: string }[];
        }
    ) {
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
        const articleJsonLd = MetadataHelper.getArticleJsonLd(meta, options?.articleData);
        const breadcrumbJsonLd = options?.breadcrumbs ? MetadataHelper.getBreadcrumbJsonLd(options.breadcrumbs) : null;

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
                <meta property="og:site_name" content="Kuray Karaaslan" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@kuraykaraaslan" />
                <meta name="twitter:creator" content="@kuraykaraaslan" />
                <meta name="twitter:title" content={String(title)} />
                <meta name="twitter:description" content={String(description)} />
                <meta name="twitter:image" content={images[0]} />
                {/* JSON-LD Structured Data */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
                {articleJsonLd && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
                )}
                {breadcrumbJsonLd && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
                )}
            </>
        );
    }

}