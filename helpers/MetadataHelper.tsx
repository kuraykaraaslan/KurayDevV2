import { Metadata } from 'next';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

export default class MetadataHelper {

    public static generateElements(meta: Metadata) {

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

}