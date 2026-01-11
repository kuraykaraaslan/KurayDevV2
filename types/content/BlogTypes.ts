import { z } from 'zod';
import { SafeUserSchema } from '../user/UserTypes';

export const CommentStatusEnum = z.enum(["NOT_PUBLISHED", "PUBLISHED", "SPAM"]);
export const PostStatusEnum = z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]);

const CommentSchema = z.object({
    commentId: z.string(),
    content: z.string(),
    createdAt: z.date(),
    postId: z.string(),
    parentId: z.string().nullable(),
    email: z.string().email().nullable(),
    name: z.string().nullable(),
    status: CommentStatusEnum.default("NOT_PUBLISHED"),
});


const PostSchema = z.object({
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
    status: PostStatusEnum.default("DRAFT"),
    views: z.number().default(0),
    deletedAt: z.date().nullable().optional(),
});

const PostTranslationSchema = z.object({
    postId: z.string(),
    language: z.string(),
    title: z.string(),
    content: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    keywords: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date(),
});

const CategorySchema = z.object({
    categoryId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
    image: z.string().nullable(),
    keywords: z.array(z.string()).optional(),
});

const CategoryTranslationSchema = z.object({
    categoryId: z.string(),
    language: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

const PostWithDataSchema = PostSchema.extend({
    author: SafeUserSchema.pick({
        userId: true,
        name: true,
        userProfile: true,
    }),
    category: CategorySchema.pick({
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


const CommentWithDataSchema = CommentSchema.extend({
    post: PostSchema.pick({
        postId: true,
        title: true,
        slug: true,
    }),
});

const PostLikeSchema = z.object({
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




export type Comment = z.infer<typeof CommentSchema>;
export type Post = z.infer<typeof PostSchema>;
export type PostTranslation = z.infer<typeof PostTranslationSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type CategoryTranslation = z.infer<typeof CategoryTranslationSchema>;
export type PostWithData = z.infer<typeof PostWithDataSchema>;
export type CommentWithData = z.infer<typeof CommentWithDataSchema>;
export type PostLike = z.infer<typeof PostLikeSchema>;
export type CommentStatus = z.infer<typeof CommentStatusEnum>;
export type PostStatus = z.infer<typeof PostStatusEnum>;

// Editor Translation Schema (shared for Post and Category)
export const EditorTranslationSchema = z.object({
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  content: z.optional(z.string()),
  keywords: z.array(z.string()).optional(),
});

export const EditorTranslationsStateSchema = z.record(z.string(), EditorTranslationSchema);

export type EditorTranslation = z.infer<typeof EditorTranslationSchema>;
export type EditorTranslationsState = z.infer<typeof EditorTranslationsStateSchema>;

export const EMPTY_EDITOR_TRANSLATION: EditorTranslation = {
  title: '',
  description: '',
  slug: '',
  content: '',
  keywords: [],
};

export { CommentSchema, PostSchema, PostTranslationSchema, CategorySchema, CategoryTranslationSchema, PostWithDataSchema, CommentWithDataSchema, PostLikeSchema };