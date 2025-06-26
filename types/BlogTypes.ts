import { z } from 'zod';

const CommentStatus = z.enum(["NOT_PUBLISHED", "PUBLISHED", "SPAM"]).default("NOT_PUBLISHED");


const Comment = z.object({
    commentId: z.string(),
    content: z.string(),
    createdAt: z.date(),
    postId: z.string(),
    parentId: z.string().nullable(),
    email: z.string().email().nullable(),
    name: z.string().nullable(),
    status: z.string().default("NOT_PUBLISHED"),
});

const PostStatus = z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).default("PUBLISHED");

const Post = z.object({
    postId: z.string(),
    title: z.string(),
    content: z.string(),
    authorId: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    keywords: z.array(z.string()),
    createdAt: z.date(),
    categoryId: z.string(),
    image: z.string().nullable(),
    status: z.string().default("PUBLISHED"),
    views: z.number().default(0),
    deletedAt: z.date().nullable(),
});

const Category = z.object({
    categoryId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
    image: z.string().nullable(),
    keywords: z.array(z.string()).optional(),
});

const PostWithCategory = Post.extend({
    category: Category.pick({
        categoryId: true,
        title: true,
        slug: true,
        image: true,
        keywords: true,
        description: true,
        createdAt: true,
        updatedAt: true,
    }),
});


const CommentWithPost = Comment.extend({
    post: Post.pick({
        postId: true,
        title: true,
        slug: true,
    }),
});

export type Comment = z.infer<typeof Comment>;
export type Post = z.infer<typeof Post>;
export type Category = z.infer<typeof Category>;
export type PostWithCategory = z.infer<typeof PostWithCategory>;
export type CommentWithPost = z.infer<typeof CommentWithPost>;
export { Comment, Post, Category, PostWithCategory, CommentWithPost };