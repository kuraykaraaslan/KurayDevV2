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
        PostService.createPost({ title: '', content: '', description: '', slug: '', keywords: [], authorId: '', categoryId: '', status: 'PUBLISHED' } as any)
      ).rejects.toThrow('All fields are required.')
    })

    it('throws when post with same title or slug exists', async () => {
      prismaMock.post.findFirst.mockResolvedValueOnce(mockPost)

      await expect(
        PostService.createPost({ title: 'Test Post', content: 'x', description: 'x', slug: 'test-post', keywords: ['x'], authorId: 'a', categoryId: 'c', status: 'PUBLISHED' } as any)
      ).rejects.toThrow('Post with the same title or slug already exists.')
    })

    it('creates post and invalidates cache on success', async () => {
      prismaMock.post.findFirst.mockResolvedValueOnce(null)
      prismaMock.post.create.mockResolvedValueOnce(mockPost)
      redisMock.del.mockResolvedValue(1)

      await PostService.createPost({
        title: 'Test Post', content: 'content', description: 'desc', slug: 'test-post',
        keywords: ['kw'], authorId: 'author-1', categoryId: 'cat-1', status: 'PUBLISHED',
      } as any)

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

    it('normalizes slug (trim/lowercase/collapse) before persisting', async () => {
      prismaMock.post.findFirst.mockResolvedValueOnce(null)
      prismaMock.post.create.mockResolvedValueOnce({ ...mockPost, slug: 'my-test-slug' })
      redisMock.del.mockResolvedValue(1)

      await PostService.createPost({
        title: 'Normalize Slug',
        content: 'content',
        description: 'desc',
        slug: '  My   Test---Slug  ',
        keywords: ['kw'],
        authorId: 'author-1',
        categoryId: 'cat-1',
        status: 'PUBLISHED',
      } as any)

      expect(prismaMock.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'my-test-slug' }),
        })
      )
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

    it('normalizes negative page and huge pageSize to safe bounds', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[], 0])

      await PostService.getAllPosts({ page: -9, pageSize: 9999, search: '' })

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 100,
        })
      )
    })

    it('excludes soft-deleted posts in public mode and allows internal ALL mode', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[], 0]).mockResolvedValueOnce([[], 0])

      await PostService.getAllPosts({ page: 0, pageSize: 10 })
      await PostService.getAllPosts({ page: 0, pageSize: 10, status: 'ALL' })

      const publicQuery = prismaMock.post.findMany.mock.calls[0][0]
      const allQuery = prismaMock.post.findMany.mock.calls[1][0]

      expect(publicQuery.where.deletedAt).toEqual({ equals: null })
      expect(allQuery.where.deletedAt).toEqual({ equals: undefined })
    })
  })

  // ── updatePost ────────────────────────────────────────────────────────
  describe('updatePost', () => {
    it('throws when required fields are missing', async () => {
      await expect(
        PostService.updatePost({ postId: 'p1', title: '', content: '', description: '', slug: '', keywords: [], authorId: '', categoryId: '', status: 'PUBLISHED' } as any)
      ).rejects.toThrow('All fields are required.')
    })

    it('updates post and invalidates cache', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce({
        postId: 'post-1',
        authorId: 'a',
        deletedAt: null,
      })
      prismaMock.post.update.mockResolvedValueOnce(mockPost)
      redisMock.del.mockResolvedValue(1)

      await PostService.updatePost({
        postId: 'post-1', title: 'Updated', content: 'x', description: 'x',
        slug: 'updated', keywords: ['k'], authorId: 'a', categoryId: 'c', status: 'PUBLISHED',
      } as any)

      expect(prismaMock.post.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: 'post-1' } })
      )
      const updateCall = prismaMock.post.update.mock.calls[0][0]
      expect(updateCall.data.authorId).toBeUndefined()
      expect(updateCall.data.createdAt).toBeUndefined()
      expect(updateCall.data.publishedAt).toBeUndefined()
      expect(redisMock.del).toHaveBeenCalledWith('sitemap:blog')
    })

    it('rejects non-owner update when requester is not admin', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce({
        postId: 'post-1',
        authorId: 'owner-1',
        deletedAt: null,
      })

      await expect(
        PostService.updatePost(
          {
            postId: 'post-1',
            title: 'Updated',
            content: 'x',
            description: 'x',
            slug: 'updated',
            keywords: ['k'],
            authorId: 'owner-1',
            categoryId: 'c',
            status: 'PUBLISHED',
          } as any,
          { requesterId: 'attacker', requesterRole: 'USER' }
        )
      ).rejects.toThrow('Forbidden.')
    })

    it('allows admin override update even when requester is not owner', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce({
        postId: 'post-1',
        authorId: 'owner-1',
        deletedAt: null,
      })
      prismaMock.post.update.mockResolvedValueOnce(mockPost)
      redisMock.del.mockResolvedValue(1)

      await PostService.updatePost(
        {
          postId: 'post-1',
          title: 'Updated',
          content: 'x',
          description: 'x',
          slug: 'updated',
          keywords: ['k'],
          authorId: 'owner-1',
          categoryId: 'c',
          status: 'PUBLISHED',
        } as any,
        { requesterId: 'admin-1', requesterRole: 'ADMIN' }
      )

      expect(prismaMock.post.update).toHaveBeenCalled()
    })

    it('blocks publishing a soft-deleted post', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce({
        postId: 'post-1',
        authorId: 'owner-1',
        deletedAt: new Date('2024-01-01'),
      })

      await expect(
        PostService.updatePost(
          {
            postId: 'post-1',
            title: 'Updated',
            content: 'x',
            description: 'x',
            slug: 'updated',
            keywords: ['k'],
            authorId: 'owner-1',
            categoryId: 'c',
            status: 'PUBLISHED',
          } as any,
          { requesterId: 'owner-1', requesterRole: 'USER' }
        )
      ).rejects.toThrow('Deleted post cannot be published.')
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

    it('rejects non-owner delete when requester is not admin', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce({ authorId: 'owner-1' })

      await expect(
        PostService.deletePost('post-1', {
          requesterId: 'attacker-1',
          requesterRole: 'USER',
        })
      ).rejects.toThrow('Forbidden.')
    })

    it('allows owner delete with auth context', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce({ authorId: 'owner-1' })
      prismaMock.post.update.mockResolvedValueOnce({
        ...mockPost,
        status: 'ARCHIVED',
        deletedAt: new Date(),
      })
      redisMock.del.mockResolvedValue(1)

      await PostService.deletePost('post-1', {
        requesterId: 'owner-1',
        requesterRole: 'USER',
      })

      expect(prismaMock.post.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: 'post-1' } })
      )
    })

    it('allows admin override delete even when requester is not owner', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce({ authorId: 'owner-1' })
      prismaMock.post.update.mockResolvedValueOnce({
        ...mockPost,
        status: 'ARCHIVED',
        deletedAt: new Date(),
      })
      redisMock.del.mockResolvedValue(1)

      await PostService.deletePost('post-1', {
        requesterId: 'admin-1',
        requesterRole: 'ADMIN',
      })

      expect(prismaMock.post.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: 'post-1' } })
      )
    })

    it('throws post not found for auth-protected delete when resource is missing', async () => {
      prismaMock.post.findUnique.mockResolvedValueOnce(null)

      await expect(
        PostService.deletePost('missing-post', {
          requesterId: 'admin-1',
          requesterRole: 'ADMIN',
        })
      ).rejects.toThrow('Post not found.')
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

    it('handles duplicate sequential increment calls (concurrency-lite)', async () => {
      prismaMock.post.update
        .mockResolvedValueOnce({ ...mockPost, views: 1 })
        .mockResolvedValueOnce({ ...mockPost, views: 2 })

      await PostService.incrementViewCount('post-1')
      await PostService.incrementViewCount('post-1')

      expect(prismaMock.post.update).toHaveBeenCalledTimes(2)
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

// ── Phase 23 additions ────────────────────────────────────────────────────────

describe('PostService – soft-deleted post is excluded from public queries', () => {
  beforeEach(() => jest.clearAllMocks())

  it('getAllPosts with no status filter excludes soft-deleted posts (deletedAt: null constraint)', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])

    await PostService.getAllPosts({ page: 0, pageSize: 10 })

    const call = prismaMock.post.findMany.mock.calls[0][0]
    // Public mode must filter out soft-deleted posts
    expect(call.where.deletedAt).toEqual({ equals: null })
  })

  it('getPostById returns null for a soft-deleted post (prisma returns no match)', async () => {
    // Simulate prisma returning null because the soft-deleted post was not found
    // (actual filtering is at DB level via WHERE deletedAt IS NULL in prod;
    //  here we confirm the service correctly propagates null)
    prismaMock.post.findUnique.mockResolvedValueOnce(null)

    const result = await PostService.getPostById('deleted-post-id')
    expect(result).toBeNull()
  })
})

describe('PostService – publish idempotency', () => {
  beforeEach(() => jest.clearAllMocks())

  it('updatePost with status=PUBLISHED on an already-published post succeeds without error', async () => {
    prismaMock.post.findUnique.mockResolvedValueOnce({
      postId: 'post-1',
      authorId: 'owner-1',
      deletedAt: null,
    })
    prismaMock.post.update.mockResolvedValueOnce({ ...mockPost, status: 'PUBLISHED' })
    redisMock.del.mockResolvedValue(1)

    await expect(
      PostService.updatePost({
        ...mockPost,
        status: 'PUBLISHED',
      } as any)
    ).resolves.not.toThrow()

    expect(prismaMock.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { postId: 'post-1' },
        data: expect.objectContaining({ status: 'PUBLISHED' }),
      })
    )
  })
})

describe('PostService – scheduled post with past publishedAt', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets status=PUBLISHED when publishedAt is in the past', async () => {
    prismaMock.post.findFirst.mockResolvedValueOnce(null)
    prismaMock.post.create.mockResolvedValueOnce({ ...mockPost, status: 'PUBLISHED' })
    redisMock.del.mockResolvedValue(1)

    const pastDate = new Date(Date.now() - 86_400_000).toISOString()
    const data = {
      title: 'Past Post',
      content: 'x',
      description: 'x',
      slug: 'past-post',
      keywords: ['k'],
      authorId: 'a',
      categoryId: 'c',
      status: 'DRAFT',
      publishedAt: pastDate,
    } as any

    await PostService.createPost(data)
    // Service auto-sets status based on publishedAt comparison
    expect(data.status).toBe('PUBLISHED')
  })

  it('sets status=SCHEDULED when publishedAt is in the future', async () => {
    prismaMock.post.findFirst.mockResolvedValueOnce(null)
    prismaMock.post.create.mockResolvedValueOnce({ ...mockPost, status: 'SCHEDULED' })
    redisMock.del.mockResolvedValue(1)

    const futureDate = new Date(Date.now() + 86_400_000).toISOString()
    const data = {
      title: 'Future Post 2',
      content: 'x',
      description: 'x',
      slug: 'future-post-2',
      keywords: ['k'],
      authorId: 'a',
      categoryId: 'c',
      status: 'DRAFT',
      publishedAt: futureDate,
    } as any

    await PostService.createPost(data)
    expect(data.status).toBe('SCHEDULED')
  })

  it('leaves status unchanged when no publishedAt is provided', async () => {
    prismaMock.post.findFirst.mockResolvedValueOnce(null)
    prismaMock.post.create.mockResolvedValueOnce(mockPost)
    redisMock.del.mockResolvedValue(1)

    const data = {
      title: 'No Date Post',
      content: 'x',
      description: 'x',
      slug: 'no-date-post',
      keywords: ['k'],
      authorId: 'a',
      categoryId: 'c',
      status: 'DRAFT',
    } as any

    await PostService.createPost(data)
    // No publishedAt — status should stay as set by caller
    expect(data.status).toBe('DRAFT')
  })
})

describe('PostService – updatePost on a soft-deleted post', () => {
  beforeEach(() => jest.clearAllMocks())

  it('throws when attempting to publish a soft-deleted post', async () => {
    prismaMock.post.findUnique.mockResolvedValueOnce({
      postId: 'post-1',
      authorId: 'owner-1',
      deletedAt: new Date('2025-01-01'),
    })

    await expect(
      PostService.updatePost({
        postId: 'post-1',
        title: 'Updated',
        content: 'x',
        description: 'x',
        slug: 'updated',
        keywords: ['k'],
        authorId: 'owner-1',
        categoryId: 'c',
        status: 'PUBLISHED',
      } as any)
    ).rejects.toThrow('Deleted post cannot be published.')
  })

  it('throws when post does not exist', async () => {
    prismaMock.post.findUnique.mockResolvedValueOnce(null)

    await expect(
      PostService.updatePost({
        postId: 'missing',
        title: 'x',
        content: 'x',
        description: 'x',
        slug: 'x',
        keywords: ['k'],
        authorId: 'a',
        categoryId: 'c',
        status: 'DRAFT',
      } as any)
    ).rejects.toThrow('Post not found.')
  })
})

// ── Additional branch coverage ────────────────────────────────────────────────

describe('PostService.getAllPosts – sort key resolution', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uses "title" sort key when explicitly provided', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, sortKey: 'title', sortDir: 'asc' })
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { title: 'asc' } }),
    )
  })

  it('uses "slug" sort key when explicitly provided', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, sortKey: 'slug', sortDir: 'desc' })
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { slug: 'desc' } }),
    )
  })

  it('uses "publishedAt" sort key when explicitly provided', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, sortKey: 'publishedAt', sortDir: 'asc' })
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { publishedAt: 'asc' } }),
    )
  })

  it('falls back to "createdAt" for an unrecognised sort key', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, sortKey: 'unknown_key' })
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    )
  })
})

describe('PostService.getAllPosts – status and filter branches', () => {
  beforeEach(() => jest.clearAllMocks())

  it('filters by status=PUBLISHED (default when no status given)', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10 })
    const query = prismaMock.post.findMany.mock.calls[0][0]
    expect(query.where.status).toBe('PUBLISHED')
  })

  it('filters by explicit status=DRAFT', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, status: 'DRAFT' })
    const query = prismaMock.post.findMany.mock.calls[0][0]
    expect(query.where.status).toBe('DRAFT')
  })

  it('sets status=undefined for status=ALL', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, status: 'ALL' })
    const query = prismaMock.post.findMany.mock.calls[0][0]
    expect(query.where.status).toBeUndefined()
  })

  it('filters by categoryId when provided', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, categoryId: 'cat-42' })
    const query = prismaMock.post.findMany.mock.calls[0][0]
    expect(query.where.categoryId).toBe('cat-42')
  })

  it('sets categoryId=undefined when not provided', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10 })
    const query = prismaMock.post.findMany.mock.calls[0][0]
    expect(query.where.categoryId).toBeUndefined()
  })

  it('filters by authorId when provided', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, authorId: 'author-99' })
    const query = prismaMock.post.findMany.mock.calls[0][0]
    expect(query.where.authorId).toBe('author-99')
  })

  it('filters by postId when provided', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, postId: 'post-999' })
    const query = prismaMock.post.findMany.mock.calls[0][0]
    expect(query.where.postId).toBe('post-999')
  })

  it('filters by slug when provided', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    await PostService.getAllPosts({ page: 0, pageSize: 10, slug: 'my-slug' })
    const query = prismaMock.post.findMany.mock.calls[0][0]
    expect(query.where.slug).toBe('my-slug')
  })

  it('filters by createdAfter when provided', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    const afterDate = new Date('2024-01-01')
    await PostService.getAllPosts({ page: 0, pageSize: 10, createdAfter: afterDate })
    const query = prismaMock.post.findMany.mock.calls[0][0]
    expect(query.where.createdAt.gte).toEqual(afterDate)
  })
})

describe('PostService.generateSiteMap', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns sitemap entries with correct url and lastModified fields', async () => {
    const createdAt = new Date('2024-06-01')
    const postForMap = { ...mockPost, createdAt }
    prismaMock.$transaction.mockResolvedValueOnce([[postForMap], 1])

    const sitemap = await PostService.generateSiteMap()

    expect(sitemap).toHaveLength(1)
    expect(sitemap[0].url).toBe('/blog/test-post')
    expect(sitemap[0].lastModified).toBe(createdAt.toISOString())
    expect(sitemap[0].changeFrequency).toBe('daily')
    expect(sitemap[0].priority).toBe(0.7)
  })

  it('returns empty array when no published posts exist', async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])
    const sitemap = await PostService.generateSiteMap()
    expect(sitemap).toEqual([])
  })
})

describe('PostService.getAllPostSlugs', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns mapped slug data for published posts', async () => {
    const createdAt = new Date('2024-01-01')
    const updatedAt = new Date('2024-06-01')
    prismaMock.post.findMany.mockResolvedValueOnce([
      {
        title: 'Test Post',
        slug: 'test-post',
        description: 'A test post',
        content: 'Content here',
        createdAt,
        updatedAt,
        category: { slug: 'tech', title: 'Tech' },
        author: { userProfile: { name: 'Author Name' } },
      },
    ])

    const result = await PostService.getAllPostSlugs()

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      title: 'Test Post',
      slug: 'test-post',
      categorySlug: 'tech',
      categoryTitle: 'Tech',
      description: 'A test post',
      content: 'Content here',
      authorName: 'Author Name',
      createdAt,
      updatedAt,
    })
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED', deletedAt: null }),
      }),
    )
  })

  it('falls back to "Kuray Karaaslan" when author profile name is absent', async () => {
    prismaMock.post.findMany.mockResolvedValueOnce([
      {
        title: 'No Author Post',
        slug: 'no-author',
        description: null,
        content: 'x',
        createdAt: new Date(),
        updatedAt: null,
        category: { slug: 'cat', title: 'Cat' },
        author: null,
      },
    ])

    const result = await PostService.getAllPostSlugs()
    expect(result[0].authorName).toBe('Kuray Karaaslan')
  })

  it('falls back to empty strings when category is missing', async () => {
    prismaMock.post.findMany.mockResolvedValueOnce([
      {
        title: 'No Cat Post',
        slug: 'no-cat',
        description: null,
        content: 'x',
        createdAt: new Date(),
        updatedAt: null,
        category: null,
        author: { userProfile: { name: 'Author' } },
      },
    ])

    const result = await PostService.getAllPostSlugs()
    expect(result[0].categorySlug).toBe('')
    expect(result[0].categoryTitle).toBe('')
  })

  it('returns empty array when no published posts exist', async () => {
    prismaMock.post.findMany.mockResolvedValueOnce([])
    const result = await PostService.getAllPostSlugs()
    expect(result).toEqual([])
  })
})
