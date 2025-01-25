import { Comment , Post } from '@prisma/client';

export type CommentWithPost = Comment & {
    post: {
        title: string;
        slug: string;
        postId: string;
        image?: string;
    }
};