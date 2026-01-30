import Article from '@/components/frontend/Features/Blog/Article';
import PostService from '@/services/PostService';
import CommentService from '@/services/CommentService';
import PostLikeService from '@/services/PostService/LikeService';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Comments from '@/components/frontend/Features/Blog/Comments';
import OtherPosts from '@/components/frontend/Features/Blog/OtherPosts';
import Newsletter from '@/components/frontend/Features/Newsletter';
import PostHeader from '@/components/frontend/Features/Blog/PostHeader';
import MetadataHelper from '@/helpers/MetadataHelper';
import ShareButtons from '@/components/frontend/Features/Blog/ShareButtons';
import TableOfContents from '@/components/frontend/Features/Blog/TableOfContents';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

type Props = {
    params: Promise<{ categorySlug: string; postSlug: string }>;
};

// Fetch post data for both metadata and page rendering
async function getPost(postSlug: string) {
    const response = await PostService.getAllPosts({
        page: 0,
        pageSize: 1,
        slug: postSlug,
        status: 'ALL',
    });
    return response.posts[0] || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { postSlug, categorySlug } = await params;
    const post = await getPost(postSlug);

    if (!post || post.status !== 'PUBLISHED') {
        return {};
    }

    const url = `${APPLICATION_HOST}/blog/${categorySlug}/${postSlug}`;
    const image = post.image || `${APPLICATION_HOST}/blog/${categorySlug}/${postSlug}/opengraph-image`;
    const description = post.description || post.content.substring(0, 150);

    return {
        title: `${post.title} | Kuray Karaaslan`,
        description,
        keywords: post.keywords?.length ? post.keywords : [post.category.title],
        robots: {
            index: post.status === 'PUBLISHED',
            follow: true,
            googleBot: {
                index: post.status === 'PUBLISHED',
                follow: true,
            },
        },
        openGraph: {
            title: `${post.title} | Kuray Karaaslan`,
            description,
            type: 'article',
            url,
            images: [{ url: image, width: 2400, height: 1260, alt: post.title }],
            locale: 'en_US',
            siteName: 'Kuray Karaaslan',
            publishedTime: post.createdAt?.toISOString(),
            modifiedTime: post.updatedAt?.toISOString(),
            authors: ['Kuray Karaaslan'],
        },
        twitter: {
            card: 'summary_large_image',
            site: '@kuraykaraaslan',
            creator: '@kuraykaraaslan',
            title: post.title,
            description,
            images: [image],
        },
        alternates: {
            canonical: url,
        },
    };
}

export default async function BlogPost({ params }: Props) {
    try {
        const { postSlug, categorySlug } = await params;

        if (!postSlug || !categorySlug) {
            notFound();
        }

        console.log("Fetching post:", postSlug, "in category:", categorySlug);

        const post = await getPost(postSlug);

        if (!post) {
            notFound();
        }

        if (post.status !== 'PUBLISHED') {
            notFound();
        }

        await PostService.incrementViewCount(post.postId);
        post.views++;

        const url = `${APPLICATION_HOST}/blog/${post.category.slug}/${post.slug}`;
        const image = post.image || `${APPLICATION_HOST}/blog/${categorySlug}/${postSlug}/opengraph-image`;

        // Metadata for JSON-LD
        const metadata: Metadata = {
            title: `${post.title} | Kuray Karaaslan`,
            description: post.description || post.content.substring(0, 150),
            openGraph: {
                title: `${post.title} | Kuray Karaaslan`,
                description: post.description || post.content.substring(0, 150),
                type: 'article',
                url,
                images: [image],
            },
        };

        // Breadcrumbs for SEO
        const breadcrumbs = [
            { name: 'Home', url: `${APPLICATION_HOST}/` },
            { name: 'Blog', url: `${APPLICATION_HOST}/blog` },
            { name: post.category.title, url: `${APPLICATION_HOST}/blog/${post.category.slug}` },
            { name: post.title, url },
        ];

        // Article data for JSON-LD
        const articleData = {
            datePublished: post.createdAt?.toISOString(),
            dateModified: post.updatedAt?.toISOString() || post.createdAt?.toISOString(),
            authorName: 'Kuray Karaaslan',
            articleSection: post.category.title,
            keywords: post.keywords?.length ? post.keywords : [post.category.title],
            wordCount: post.content.split(/\s+/).length,
            commentCount: 0, // Will be updated below
        };

        // Fetch comments for schema (server-side)
        let commentsForSchema: { commentId: string; content: string; createdAt: Date | string; name: string | null }[] = [];
        try {
            const commentsResponse = await CommentService.getAllComments({
                page: 0,
                pageSize: 50, // Limit to 50 comments for schema
                postId: post.postId,
            });
            commentsForSchema = commentsResponse.comments.map(c => ({
                commentId: c.commentId,
                content: c.content,
                createdAt: c.createdAt,
                name: c.name,
            }));
            articleData.commentCount = commentsResponse.total;
        } catch (error) {
            console.error('Error fetching comments for schema:', error);
        }

        // Fetch like count for AggregateRating schema
        let likeCount = 0;
        try {
            likeCount = await PostLikeService.countLikes(post.postId);
        } catch (error) {
            console.error('Error fetching like count for schema:', error);
        }

        return (
            <>
                {MetadataHelper.generateJsonLdScripts(metadata, { 
                    articleData, 
                    breadcrumbs, 
                    comments: commentsForSchema,
                    rating: likeCount > 0 ? { likeCount } : undefined
                })}
                <section className="min-h-screen bg-base-100 pt-32" id="blog">
                    <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col max-w-7xl">
                        <PostHeader {...post} />
                        <TableOfContents content={post.content} />
                        <Article {...post} />
                        <ShareButtons title={post.title} url={url} />
                        <OtherPosts />
                        <Comments postId={post.postId} />
                    </div>
                </section>
                <Newsletter />
            </>
        );
    } catch (error) {
        console.error('Error fetching post:', error);
        notFound();
    }
}
