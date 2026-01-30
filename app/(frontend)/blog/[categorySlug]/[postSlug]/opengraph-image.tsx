import PostService from '@/services/PostService';
import PostCoverService from '@/services/PostService/PostCoverService';

export const alt = 'Blog Post Cover';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

async function getPost(postSlug: string) {
    const response = await PostService.getAllPosts({
        page: 0,
        pageSize: 1,
        slug: postSlug,
        status: 'ALL',
    });
    return response.posts[0] || null;
}

export default async function Image({ params }: { params: Promise<{ postSlug: string }> }) {
    const { postSlug } = await params;
    const post = await getPost(postSlug);

    if (!post) {
        return new Response('Not Found', { status: 404 });
    }

    return PostCoverService.getImage(post);
}
