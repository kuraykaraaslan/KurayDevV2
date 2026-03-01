import { z } from 'zod'
import { SafeUserSchema } from '../user/UserTypes'
import { AppLanguageEnum } from '../common/I18nTypes'
import { PostSeriesRefSchema } from './SeriesTypes'

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

const CommentStatusEnum = z.enum(['NOT_PUBLISHED', 'PUBLISHED', 'SPAM'])
const PostStatusEnum = z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED', 'SCHEDULED'])

const CommentSchema = z.object({
  commentId: z.string(),
  content: z.string(),
  createdAt: z.date(),
  postId: z.string(),
  parentId: z.string().nullable(),
  email: z.string().email().nullable(),
  name: z.string().nullable(),
  status: CommentStatusEnum.default('NOT_PUBLISHED'),
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
  status: PostStatusEnum.default('DRAFT'),
  views: z.number().default(0),
  publishedAt: z.coerce.date().nullable().optional(),
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
  seriesEntry: PostSeriesRefSchema.nullable().optional(),
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

export const KnowledgeGraphLinkSchema = z.object({
  source: z.string(),
  target: z.string(),
})

export const KnowledgeGraphNodePositionSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  vx: z.number(),
  vy: z.number(),
  radius: z.number(),
  color: z.string(),
  data: KnowledgeGraphNodeSchema,
})

export const KnowledgeGraphParticleSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  progress: z.number(),
  direction: z.number(),
})

export const KnowledgeGraphTooltipStateSchema = z.object({
  visible: z.boolean(),
  x: z.number(),
  y: z.number(),
  title: z.string(),
  image: z.string().optional()
})

export type KnowledgeGraphNode = z.infer<typeof KnowledgeGraphNodeSchema>
export type KnowledgeGraphLink = z.infer<typeof KnowledgeGraphLinkSchema>
export type KnowledgeGraphNodePosition = z.infer<typeof KnowledgeGraphNodePositionSchema>
export type KnowledgeGraphParticle = z.infer<typeof KnowledgeGraphParticleSchema>
export type KnowledgeGraphTooltipState = z.infer<typeof KnowledgeGraphTooltipStateSchema>

export type PostStatus= z.infer<typeof PostStatusEnum>
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
  CommentStatusEnum,
  PostStatusEnum,
}
