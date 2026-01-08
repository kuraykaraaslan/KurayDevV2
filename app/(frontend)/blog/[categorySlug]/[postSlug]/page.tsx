import Article from '@/components/frontend/Features/Blog/Article';
import PostService from '@/services/PostService';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Comments from '@/components/frontend/Features/Blog/Comments';
import OtherPosts from '@/components/frontend/Features/Blog/OtherPosts';
import Newsletter from '@/components/frontend/Features/Newsletter';
import PostHeader from '@/components/frontend/Features/Blog/PostHeader';
import MetadataHelper from '@/helpers/MetadataHelper';
import ShareButtons from '@/components/frontend/Features/Blog/ShareButtons';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

export default async function BlogPost({ params }: { params: { categorySlug: string, postSlug: string } }) {
    try {

        const { postSlug, categorySlug } = await params;


        if (!postSlug) {
            notFound();
        }

        if (!categorySlug) {
            notFound();
        }

        console.log("Fetching post:", postSlug, "in category:", categorySlug);

        const response = await PostService.getAllPosts({
            page: 0,
            pageSize: 1,
            slug: postSlug,
            status: 'ALL',
        });

        const { posts } = response;

        if (!posts || posts.length === 0) {
            notFound();
        }

        const post = posts[0];

        if (!post) {
            notFound();
        }

        if (post.status !== 'PUBLISHED') {
            // Check if the user is authenticated and has the required role
            notFound();
        }

        await PostService.incrementViewCount(post.postId);
        post.views++;

        const metadata : Metadata = {
            title: `${post.title} | Kuray Karaaslan`,
            description: post.description || post.content.substring(0, 150),
            openGraph: {
                title: `${post.title} | Kuray Karaaslan`,
                description: post.description || post.content.substring(0, 150),
                type: 'article',
                url: `${APPLICATION_HOST}/blog/${post.category.slug}/${post.slug}`,
                images: [ post.image ? post.image : `${APPLICATION_HOST}/api/posts/${post.postId}/cover.jpeg` ],
            },
        }

        return (
            <>
                {MetadataHelper.generateElements(metadata)}
                <section className="min-h-screen bg-base-100 pt-32" id="blog">
                    <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col max-w-7xl">
                        <PostHeader {...post} />
                        <Article {...post} />
                        <ShareButtons title={post.title} url={`${APPLICATION_HOST}/blog/${post.category.slug}/${post.slug}`} />
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
