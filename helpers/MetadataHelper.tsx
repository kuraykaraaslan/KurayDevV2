import { Metadata } from 'next';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

export default class MetadataHelper {

    // Generate JSON-LD for WebSite with SearchAction (enables sitelinks search box in Google)
    public static getWebSiteJsonLd() {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Kuray Karaaslan",
            "alternateName": ["Kuray Dev", "kuray.dev"],
            "url": APPLICATION_HOST,
            "description": "Software developer, tech blogger, and open-source enthusiast sharing coding tutorials and insights.",
            "inLanguage": "en-US",
            "publisher": {
                "@type": "Person",
                "name": "Kuray Karaaslan",
                "url": APPLICATION_HOST
            },
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${APPLICATION_HOST}/blog?search={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            }
        };
    }

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

    // Generate JSON-LD for Comments
    public static getCommentsJsonLd(comments: {
        commentId: string;
        content: string;
        createdAt: Date | string;
        name: string | null;
    }[], articleUrl: string) {
        if (!comments || comments.length === 0) return null;

        return comments.map(comment => ({
            "@context": "https://schema.org",
            "@type": "Comment",
            "@id": `${articleUrl}#comment-${comment.commentId}`,
            "text": comment.content,
            "dateCreated": typeof comment.createdAt === 'string' 
                ? comment.createdAt 
                : comment.createdAt.toISOString(),
            "author": {
                "@type": "Person",
                "name": comment.name || "Anonymous"
            },
            "about": {
                "@id": articleUrl
            }
        }));
    }

    // Generate Article JSON-LD with comment count
    public static getArticleWithCommentsJsonLd(meta: Metadata, articleData?: {
        datePublished?: string;
        dateModified?: string;
        authorName?: string;
        articleSection?: string;
        keywords?: string[];
        wordCount?: number;
        commentCount?: number;
    }) {
        const baseJsonLd = MetadataHelper.getArticleJsonLd(meta, articleData);
        if (!baseJsonLd) return null;

        if (articleData?.commentCount !== undefined) {
            baseJsonLd["commentCount"] = articleData.commentCount;
            baseJsonLd["interactionStatistic"] = {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/CommentAction",
                "userInteractionCount": articleData.commentCount
            };
        }

        return baseJsonLd;
    }

    // Generate JSON-LD for AggregateRating (based on likes)
    public static getAggregateRatingJsonLd(articleUrl: string, ratingData: {
        likeCount: number;
        maxRating?: number;
    }) {
        if (!ratingData || ratingData.likeCount === 0) return null;

        // Convert likes to a rating scale (1-5)
        // More likes = higher rating, capped at 5
        const maxRating = ratingData.maxRating || 5;
        const ratingValue = Math.min(maxRating, Math.max(1, 3 + Math.log10(ratingData.likeCount + 1)));

        return {
            "@context": "https://schema.org",
            "@type": "AggregateRating",
            "itemReviewed": {
                "@type": "Article",
                "@id": articleUrl
            },
            "ratingValue": parseFloat(ratingValue.toFixed(1)),
            "bestRating": maxRating,
            "worstRating": 1,
            "ratingCount": ratingData.likeCount
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
                commentCount?: number;
            };
            breadcrumbs?: { name: string; url: string }[];
            comments?: {
                commentId: string;
                content: string;
                createdAt: Date | string;
                name: string | null;
            }[];
            rating?: {
                likeCount: number;
                maxRating?: number;
            };
            includeWebSite?: boolean;
        }
    ) {
        const webSiteJsonLd = MetadataHelper.getWebSiteJsonLd();
        const orgJsonLd = MetadataHelper.getOrganizationJsonLd();
        const articleJsonLd = options?.articleData?.commentCount !== undefined
            ? MetadataHelper.getArticleWithCommentsJsonLd(meta, options.articleData)
            : MetadataHelper.getArticleJsonLd(meta, options?.articleData);
        const breadcrumbJsonLd = options?.breadcrumbs ? MetadataHelper.getBreadcrumbJsonLd(options.breadcrumbs) : null;
        const articleUrl = String(meta?.openGraph?.url || '');
        const commentsJsonLd = options?.comments ? MetadataHelper.getCommentsJsonLd(options.comments, articleUrl) : null;
        const ratingJsonLd = options?.rating ? MetadataHelper.getAggregateRatingJsonLd(articleUrl, options.rating) : null;

        return (
            <>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
                {articleJsonLd && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
                )}
                {breadcrumbJsonLd && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
                )}
                {commentsJsonLd && commentsJsonLd.length > 0 && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(commentsJsonLd) }} />
                )}
                {ratingJsonLd && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ratingJsonLd) }} />
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
        const webSiteJsonLd = MetadataHelper.getWebSiteJsonLd();
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
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }} />
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