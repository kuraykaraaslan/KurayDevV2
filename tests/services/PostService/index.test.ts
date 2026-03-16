import PostService from '@/services/PostService'
import redis from '@/libs/redis'
import { prisma } from '@/libs/prisma'
import type { PostWithData } from '@/types/content/BlogTypes'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    post: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const prismaMock = prisma as any
const redisMock = redis as jest.Mocked<typeof redis>

const mockPost = {
  postId: 'post-1',
  title: 'Test Post',
  description: 'A test post',
  slug: 'test-post',
  keywords: ['test'],
  image: null,
  authorId: 'author-1',
  categoryId: 'cat-1',
  content: 'Post content here',
  status: 'PUBLISHED',
  views: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  publishedAt: new Date('2024-01-01'),
  deletedAt: null,
  category: { categoryId: 'cat-1', title: 'Tech', slug: 'tech', image: null },
  author: { userId: 'author-1', userProfile: { name: 'Author' } },
  translations: [],
}

describe('PostService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── applyTranslation ─────────────────────────────────────────────────
  describe('applyTranslation', () => {
    it('returns original post when lang is "en"', () => {
      const post = { ...mockPost } as unknown as PostWithData
      const result = PostService.applyTranslation(post, 'en')
      expect(result.title).toBe('Test Post')
    })

    it('returns original post when no translations exist', () => {
      const post = { ...mockPost, translations: [] } as unknown as PostWithData
      const result = PostService.applyTranslation(post, 'tr')
      expect(result.title).toBe('Test Post')
    })

    it('applies translation when matching lang exists', () => {
      const post = {
        ...mockPost,
        translations: [{ id: 1, postId: 'post-1', lang: 'tr', title: 'Türkçe Başlık', content: 'İçerik', description: 'Açıklama', slug: 'test-post-tr' }],
      } as unknown as PostWithData
      const result = PostService.applyTranslation(post, 'tr')
      expect(result.title).toBe('Türkçe Başlık')
      expect(result.content).toBe('İçerik')
    })

    it('returns original when no matching lang translation', () => {
      const post = {
        ...mockPost,
        translations: [{ id: 1, postId: 'post-1', lang: 'de', title: 'Deutsch', content: 'Inhalt', description: 'Beschreibung', slug: 'test-de' }],
      } as unknown as PostWithData
      const result = PostService.applyTranslation(post, 'tr')
      expect(result.title).toBe('Test Post')
    })
  })

  // ── createPost ────────────────────────────────────────────────────────
  describe('createPost', () => {
    it('throws when required fields are missing', async () => {
      await expect(
        PostService.createPost({ title: '', content: '', description: '', slug: '', keywords: [], authorId: '', categoryId: '', status: 'PUBLISHED' })
      ).rejects.toThrow('All fields are required.')
    })

    it('throws when post with same title or slug exists', async () => {
      prismaMock.post.findFirst.mockResolvedValueOnce(mockPost)

      await expect(
        PostService.createPost({ title: 'Test Post', content: 'x', description: 'x', slug: 'test-post', keywords: ['x'], authorId: 'a', categoryId: 'c', status: 'PUBLISHED' })
      ).rejects.toThrow('Post with the same title or slug already exists.')
    })

    it('creates post and invalidates cache on success', async () => {
      prismaMock.post.findFirst.mockResolvedValueOnce(null)
      prismaMock.post.create.mockResolvedValueOnce(mockPost)
      redisMock.del.mockResolvedValue(1)

      await PostService.createPost({
        title: 'Test Post', content: 'content', description: 'desc', slug: 'test-post',
        keywords: ['kw'], authorId: 'author-1', categoryId: 'cat-1', status: 'PUBLISHED',
      })

      expect(prismaMock.post.create).toHaveBeenCalled()
      expect(redisMock.del).toHaveBeenCalledWith('sitemap:blog')
    })

    it('sets status=SCHEDULED for future publishedAt', async () => {
      prismaMock.post.findFirst.mockResolvedValueOnce(null)
      prismaMock.post.create.mockResolvedValueOnce({ ...mockPost, status: 'SCHEDULED' })
      redisMock.del.mockResolvedValue(1)

      const future = new Date(Date.now() + 86_400_000).toISOString()
      const data = {
        title: 'Future Post', content: 'x', description: 'x', slug: 'future',
        keywords: ['k'], authorId: 'a', categoryId: 'c', status: 'DRAFT',
        publishedAt: future,
      } as any

      await PostService.createPost(data)
      expect(data.status).toBe('SCHEDULED')
    })
  })

  // ── getAllPosts ───────────────────────────────────────────────────────
  describe('getAllPosts', () => {
    it('returns posts and total from transaction', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[mockPost], 1])

      const result = await PostService.getAllPosts({ page: 0, pageSize: 10 })
      expect(result.posts).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('returns empty list when no posts', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[], 0])

      const result = await PostService.getAllPosts({ page: 0, pageSize: 10, search: 'nonexistent' })
      expect(result.posts).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('applies translation when lang is provided', async () => {
      const postWithTranslation = {
        ...mockPost,
        translations: [{ id: 1, postId: 'post-1', lang: 'tr', title: 'TR Başlık', content: 'İçerik', description: 'Açık', slug: 'slug-tr' }],
      }
      prismaMock.$transaction.mockResolvedValueOnce([[postWithTranslation], 1])

      const result = await PostService.getAllPosts({ page: 0, pageSize: 10, lang: 'tr' })
      expect(result.posts[0].title).toBe('TR Başlık')
    })
  })

  // ── updatePost ────────────────────────────────────────────────────────
  describe('updatePost', () => {
    it('throws when required fields are missing', async () => {
      await expect(
        PostService.updatePost({ postId: 'p1', title: '', content: '', description: '', slug: '', keywords: [], authorId: '', categoryId: '', status: 'PUBLISHED' })
      ).rejects.toThrow('All fields are required.')
    })

    it('updates post and invalidates cache', async () => {
      prismaMock.post.update.mockResolvedValueOnce(mockPost)
      redisMock.del.mockResolvedValue(1)

      await PostService.updatePost({
        postId: 'post-1', title: 'Updated', content: 'x', description: 'x',
        slug: 'updated', keywords: ['k'], authorId: 'a', categoryId: 'c', status: 'PUBLISHED',
      })

      expect(prismaMock.post.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: 'post-1' } })
      )
      expect(redisMock.del).toHaveBeenCalledWith('sitemap:blog')
    })
  })

  // ── deletePost ────────────────────────────────────────────────────────
  describe('deletePost', () => {
    it('soft-deletes (archives) post and clears cache', async () => {
      prismaMock.post.update.mockResolvedValueOnce({ ...mockPost, status: 'ARCHIVED', deletedAt: new Date() })
      redisMock.del.mockResolvedValue(1)

      await PostService.deletePost('post-1')

      expect(prismaMock.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { postId: 'post-1' },
          data: expect.objectContaining({ status: 'ARCHIVED' }),
        })
      )
      expect(redisMock.del).toHaveBeenCalledWith('sitemap:blog')
    })
  })

  // ── incrementViewCount ────────────────────────────────────────────────
  describe('incrementViewCount', () => {
    it('increments views field via prisma update', async () => {
      prismaMock.post.update.mockResolvedValueOnce({ ...mockPost, views: 1 })

      await PostService.incrementViewCount('post-1')

      expect(prismaMock.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { postId: 'post-1' },
          data: { views: { increment: 1 } },
        })
      )
    })
  })

  // ── getPostById ───────────────────────────────────────────────────────
  describe('getPostById', () => {
    it('returns null when post not found', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce(null)
      const result = await PostService.getPostById('nonexistent')
      expect(result).toBeNull()
    })

    it('returns post with translation applied', async () => {
      const postWithTranslation = {
        ...mockPost,
        translations: [{ id: 1, postId: 'post-1', lang: 'tr', title: 'TR', content: 'C', description: 'D', slug: 's' }],
        seriesEntry: null,
      }
      prismaMock.post.findUnique.mockResolvedValueOnce(postWithTranslation)

      const result = await PostService.getPostById('post-1', 'tr')
      expect(result?.title).toBe('TR')
    })
  })
})
