import { z } from 'zod';
import { SafeUserSchema } from './UserTypes';

const CommentStatus = z.enum(["NOT_PUBLISHED", "PUBLISHED", "SPAM"]).default("NOT_PUBLISHED");
const PostStatus = z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).default("PUBLISHED");


const Comment = z.object({
    commentId: z.string(),
    content: z.string(),
    createdAt: z.date(),
    postId: z.string(),
    parentId: z.string().nullable(),
    email: z.string().email().nullable(),
    name: z.string().nullable(),
    status: CommentStatus,
});


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
    deletedAt: z.date().nullable().optional(),
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

const PostWithData = Post.extend({
    author: SafeUserSchema.pick({
        userId: true,
        name: true,
        userProfile: true,
    }),
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


const CommentWithData = Comment.extend({
    post: Post.pick({
        postId: true,
        title: true,
        slug: true,
    }),
});

const PostLike = z.object({
  postLikeId: z.string(),
  postId: z.string(),
  userId: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  deviceFingerprint: z.string().nullable().optional(),
  createdAt: z.date(),
});


export const KnowledgeGraphNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  categorySlug: z.string(),
  image: z.string().nullable().optional(),
  views: z.number(),
  embedding: z.array(z.number()),
  size: z.number().nullable().optional(),
});

export type KnowledgeGraphNode = z.infer<typeof KnowledgeGraphNodeSchema>;




export type Comment = z.infer<typeof Comment>;
export type Post = z.infer<typeof Post>;
export type Category = z.infer<typeof Category>;
export type PostWithData = z.infer<typeof PostWithData>;
export type CommentWithData = z.infer<typeof CommentWithData>;
export type PostLike = z.infer<typeof PostLike>;
export { Comment, Post, Category, PostWithData, CommentWithData , PostLike, CommentStatus, PostStatus };