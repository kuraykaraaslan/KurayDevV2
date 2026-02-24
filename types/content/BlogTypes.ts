import { z } from 'zod'
import { SafeUserSchema } from '../user/UserTypes'
import { AppLanguageEnum } from '../common/I18nTypes'

const PostTranslationSchema = z.object({
  id: z.string(),
  postId: z.string(),
  lang: AppLanguageEnum,
  title: z.string(),
  content: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
})

const CategoryTranslationSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  lang: AppLanguageEnum,
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
})

const CommentStatus = z.enum(['NOT_PUBLISHED', 'PUBLISHED', 'SPAM']).default('NOT_PUBLISHED')
const PostStatus = z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).default('PUBLISHED')

const CommentSchema = z.object({
  commentId: z.string(),
  content: z.string(),
  createdAt: z.date(),
  postId: z.string(),
  parentId: z.string().nullable(),
  email: z.string().email().nullable(),
  name: z.string().nullable(),
  status: CommentStatus,
})

const PostSchema = z.object({
  postId: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  keywords: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z
    .date()
    .nullable()
    .transform((date) => date || new Date()),
  categoryId: z.string(),
  image: z.string().nullable(),
  status: z.string().default('PUBLISHED'),
  views: z.number().default(0),
  deletedAt: z.date().nullable().optional(),
})

const CategorySchema = z.object({
  categoryId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  image: z.string().nullable(),
  keywords: z.array(z.string()).optional(),
})

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
  translations: z.array(PostTranslationSchema).optional(),
})

const CommentWithDataSchema = CommentSchema.extend({
  post: PostSchema.pick({
    postId: true,
    title: true,
    slug: true,
  }),
})

const PostLikeSchema = z.object({
  postLikeId: z.string(),
  postId: z.string(),
  userId: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  deviceFingerprint: z.string().nullable().optional(),
  createdAt: z.date(),
})

export const KnowledgeGraphNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  categorySlug: z.string(),
  image: z.string().nullable().optional(),
  views: z.number(),
  embedding: z.array(z.number()),
  size: z.number().nullable().optional(),
})

export type KnowledgeGraphNode = z.infer<typeof KnowledgeGraphNodeSchema>

export type Comment = z.infer<typeof CommentSchema>
export type Post = z.infer<typeof PostSchema>
export type Category = z.infer<typeof CategorySchema>
export type CategoryWithTranslations = Category & { translations?: CategoryTranslation[] }
export type PostWithData = z.infer<typeof PostWithDataSchema>
export type CommentWithData = z.infer<typeof CommentWithDataSchema>
export type PostLike = z.infer<typeof PostLikeSchema>
export type PostTranslation = z.infer<typeof PostTranslationSchema>
export type CategoryTranslation = z.infer<typeof CategoryTranslationSchema>
export {
  CommentSchema,
  PostSchema,
  CategorySchema,
  PostWithDataSchema,
  CommentWithDataSchema,
  PostLikeSchema,
  PostTranslationSchema,
  CategoryTranslationSchema,
  CommentStatus,
  PostStatus,
}
