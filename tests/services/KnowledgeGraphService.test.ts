// KnowledgeGraphService instantiates BullMQ Queue + Worker at module load time,
// so they must be mocked before any import of the service.

jest.mock('bullmq', () => {
  const add = jest.fn().mockResolvedValue({ id: 'job-1' })

  const queueOn = jest.fn()
  const workerOn = jest.fn()

  let workerProcessor: any = null
  const workerHandlers: Record<string, any> = {}

  const Queue = jest.fn().mockImplementation(() => ({ add, on: queueOn }))
  const Worker = jest.fn().mockImplementation((_name, processor) => {
    workerProcessor = processor
    return {
      on: workerOn.mockImplementation((event: string, cb: any) => {
        workerHandlers[event] = cb
      }),
    }
  })

  return {
    Queue,
    Worker,
    __workerProcessor: () => workerProcessor,
    __workerHandler: (event: string) => workerHandlers[event],
  }
})

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get:  jest.fn(),
    set:  jest.fn(),
    hset: jest.fn(),
  },
}))

jest.mock('@/services/PostService/LocalEmbedService', () => ({
  __esModule: true,
  default: {
    embed: jest.fn(),
  },
}))

jest.mock('@/helpers/Cosine', () => ({
  cosine: jest.fn(),
}))

jest.mock('@/services/PostService', () => ({
  __esModule: true,
  default: {
    getAllPosts: jest.fn(),
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

// ── Imports after mocking ─────────────────────────────────────────────────────

import KnowledgeGraphService from '@/services/KnowledgeGraphService'
import redis from '@/libs/redis'
import PostService from '@/services/PostService'
import LocalEmbedService from '@/services/PostService/LocalEmbedService'
import Logger from '@/libs/logger'
import { cosine } from '@/helpers/Cosine'

const redisMock = redis as jest.Mocked<typeof redis>
const postServiceMock = PostService as jest.Mocked<typeof PostService>
const embedMock = LocalEmbedService as any
const loggerMock = Logger as any
const cosineMock = cosine as jest.MockedFunction<typeof cosine>

// ── Fixtures ──────────────────────────────────────────────────────────────────

const POST_A = {
  postId:      'post-001',
  title:       'TypeScript Deep Dive',
  slug:        'typescript-deep-dive',
  description: 'All about TypeScript',
  keywords:    ['typescript', 'programming'],
  content:     '<p>Content about TypeScript</p>',
  image:       '/img/ts.jpg',
  category:    { slug: 'programming' },
  views:       200,
}

const POST_B = {
  postId:      'post-002',
  title:       'React Hooks Guide',
  slug:        'react-hooks-guide',
  description: 'Hooks explained',
  keywords:    ['react', 'hooks'],
  content:     '<p>Content about React</p>',
  image:       null,
  category:    { slug: 'frontend' },
  views:       150,
}

const EMBEDDING_A = [0.1, 0.2, 0.3]
const EMBEDDING_B = [0.4, 0.5, 0.6]

const KG_NODES = {
  'post-001': {
    id:           'post-001',
    title:        'TypeScript Deep Dive',
    slug:         'typescript-deep-dive',
    categorySlug: 'programming',
    views:        200,
    embedding:    EMBEDDING_A,
  },
  'post-002': {
    id:           'post-002',
    title:        'React Hooks Guide',
    slug:         'react-hooks-guide',
    categorySlug: 'frontend',
    views:        150,
    embedding:    EMBEDDING_B,
  },
}

const LINKS_POST_001 = [{ id: 'post-002', s: 0.85 }]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('KnowledgeGraphService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── queueFullRebuild ───────────────────────────────────────────────────────
  describe('queueFullRebuild', () => {
    it('adds a fullRebuild job to the queue', async () => {
      await KnowledgeGraphService.queueFullRebuild()

      expect(KnowledgeGraphService.QUEUE.add).toHaveBeenCalledWith(
        'fullRebuild',
        { type: 'fullRebuild' },
      )
    })
  })

  // ── queueUpdatePost ────────────────────────────────────────────────────────
  describe('queueUpdatePost', () => {
    it('adds an updatePost job with the correct postId', async () => {
      await KnowledgeGraphService.queueUpdatePost('post-001')

      expect(KnowledgeGraphService.QUEUE.add).toHaveBeenCalledWith(
        'updatePost',
        { type: 'updatePost', postId: 'post-001' },
      )
    })
  })

  // ── getSimilarPosts ────────────────────────────────────────────────────────
  describe('getSimilarPosts', () => {
    it('returns similar posts ordered by similarity score', async () => {
      redisMock.get.mockResolvedValueOnce(JSON.stringify(LINKS_POST_001))
      postServiceMock.getAllPosts.mockResolvedValueOnce({
        posts: [POST_B as any],
        total: 1,
      })

      const result = await KnowledgeGraphService.getSimilarPosts('post-001')

      expect(result).toHaveLength(1)
      expect(result[0].postId).toBe('post-002')
    })

    it('returns empty array when no links exist for the post', async () => {
      redisMock.get.mockResolvedValueOnce(null)

      const result = await KnowledgeGraphService.getSimilarPosts('post-no-links')

      expect(result).toEqual([])
    })

    it('returns empty array when links list is empty JSON array', async () => {
      redisMock.get.mockResolvedValueOnce('[]')

      const result = await KnowledgeGraphService.getSimilarPosts('post-001')

      expect(result).toEqual([])
    })

    it('filters out links below the similarity threshold', async () => {
      // Score 0.05 is below the THRESH constant (0.22)
      const lowScoreLinks = [{ id: 'post-002', s: 0.05 }]
      redisMock.get.mockResolvedValueOnce(JSON.stringify(lowScoreLinks))

      const result = await KnowledgeGraphService.getSimilarPosts('post-001')

      expect(result).toEqual([])
      expect(postServiceMock.getAllPosts).not.toHaveBeenCalled()
    })

    it('respects the limit parameter', async () => {
      const manyLinks = [
        { id: 'post-002', s: 0.9 },
        { id: 'post-003', s: 0.85 },
        { id: 'post-004', s: 0.80 },
      ]
      redisMock.get.mockResolvedValueOnce(JSON.stringify(manyLinks))
      postServiceMock.getAllPosts.mockResolvedValueOnce({
        posts: [
          { ...POST_B, postId: 'post-002' } as any,
          { ...POST_B, postId: 'post-003' } as any,
        ],
        total: 2,
      })

      const result = await KnowledgeGraphService.getSimilarPosts('post-001', 2)

      expect(postServiceMock.getAllPosts).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 2 }),
      )
    })

    it('returns posts in the same order as the sorted link ids', async () => {
      const links = [
        { id: 'post-003', s: 0.95 },
        { id: 'post-002', s: 0.75 },
      ]
      redisMock.get.mockResolvedValueOnce(JSON.stringify(links))
      postServiceMock.getAllPosts.mockResolvedValueOnce({
        posts: [
          { ...POST_B, postId: 'post-002' } as any,
          { ...POST_B, postId: 'post-003', title: 'Post Three' } as any,
        ],
        total: 2,
      })

      const result = await KnowledgeGraphService.getSimilarPosts('post-001')

      // post-003 has higher score so should be first
      expect(result[0].postId).toBe('post-003')
      expect(result[1].postId).toBe('post-002')
    })
  })

  // ── QUEUE_NAME constant ────────────────────────────────────────────────────
  describe('QUEUE_NAME', () => {
    it('has a defined queue name', () => {
      expect(KnowledgeGraphService.QUEUE_NAME).toBe('knowledgeGraphQueue')
    })
  })

  // ── Internal logic (private) ─────────────────────────────────────────────
  describe('internal rebuild/update', () => {
    it('updatePostInternal returns early when post not found', async () => {
      postServiceMock.getAllPosts.mockResolvedValueOnce({ posts: [], total: 0 } as any)

      await (KnowledgeGraphService as any)._updatePostInternal('post-404')

      expect(redisMock.get).not.toHaveBeenCalled()
      expect(redisMock.set).not.toHaveBeenCalled()
    })

    it('updatePostInternal saves nodes and writes forward+reverse links', async () => {
      postServiceMock.getAllPosts.mockResolvedValueOnce({ posts: [POST_A as any], total: 1 } as any)
      ;(LocalEmbedService as any).embed.mockResolvedValueOnce([EMBEDDING_A])

      // loadNodes
      redisMock.get.mockResolvedValueOnce(JSON.stringify(KG_NODES) as any)
      // reverse links for post-002
      redisMock.get.mockResolvedValueOnce('[]' as any)

      cosineMock.mockReturnValueOnce(0.85)

      await (KnowledgeGraphService as any)._updatePostInternal('post-001')

      expect(redisMock.set).toHaveBeenCalledWith('kg:nodes', expect.any(String))
      expect(redisMock.set).toHaveBeenCalledWith('kg:links:post-001', expect.any(String))
      expect(redisMock.set).toHaveBeenCalledWith(
        'kg:links:post-002',
        expect.stringContaining('post-001')
      )
    })

    it('updatePostInternal updates existing reverse link entry when present', async () => {
      postServiceMock.getAllPosts.mockResolvedValueOnce({ posts: [POST_A as any], total: 1 } as any)
      ;(LocalEmbedService as any).embed.mockResolvedValueOnce([EMBEDDING_A])

      redisMock.get.mockResolvedValueOnce(JSON.stringify(KG_NODES) as any)
      redisMock.get.mockResolvedValueOnce(JSON.stringify([{ id: 'post-001', s: 0.1 }]) as any)

      cosineMock.mockReturnValueOnce(0.9)

      await (KnowledgeGraphService as any)._updatePostInternal('post-001')

      expect(redisMock.set).toHaveBeenCalledWith(
        'kg:links:post-002',
        expect.stringContaining('"s":0.9')
      )
    })

    it('fullRebuildInternal aborts cleanly when no posts exist', async () => {
      postServiceMock.getAllPosts.mockResolvedValueOnce({ posts: [], total: 0 } as any)

      await (KnowledgeGraphService as any)._fullRebuildInternal()

      expect(loggerMock.warn).toHaveBeenCalled()
      expect(redisMock.hset).toHaveBeenCalledWith(
        'kg:meta',
        expect.objectContaining({ status: 'running' })
      )
    })

    it('fullRebuildInternal saves nodes and link sets, then marks completed', async () => {
      postServiceMock.getAllPosts.mockResolvedValueOnce({
        posts: [POST_A as any, POST_B as any],
        total: 2,
      } as any)
      ;(LocalEmbedService as any).embed.mockResolvedValueOnce([EMBEDDING_A, EMBEDDING_B])
      cosineMock.mockReturnValue(0.95)

      await (KnowledgeGraphService as any)._fullRebuildInternal()

      expect(redisMock.set).toHaveBeenCalledWith('kg:nodes', expect.any(String))
      expect(redisMock.set).toHaveBeenCalledWith('kg:links:post-001', expect.any(String))
      expect(redisMock.set).toHaveBeenCalledWith('kg:links:post-002', expect.any(String))
      expect(redisMock.hset).toHaveBeenCalledWith(
        'kg:meta',
        expect.objectContaining({ status: 'completed', postCount: 2 })
      )
    })

    it('fullRebuildInternal marks failed when an error occurs', async () => {
      postServiceMock.getAllPosts.mockRejectedValueOnce(new Error('boom'))

      await (KnowledgeGraphService as any)._fullRebuildInternal()

      expect(loggerMock.error).toHaveBeenCalled()
      expect(redisMock.hset).toHaveBeenCalledWith(
        'kg:meta',
        expect.objectContaining({ status: 'failed' })
      )
    })
  })

  // ── Worker processor and event handlers ───────────────────────────────────
  describe('worker wiring', () => {
    it('runs processor for fullRebuild and updatePost jobs', async () => {
      const bullmq = require('bullmq')
      const proc = bullmq.__workerProcessor()

      const fullSpy = jest
        .spyOn(KnowledgeGraphService as any, '_fullRebuildInternal')
        .mockResolvedValueOnce(undefined)
      const updSpy = jest
        .spyOn(KnowledgeGraphService as any, '_updatePostInternal')
        .mockResolvedValueOnce(undefined)

      await proc({ id: 'job-1', data: { type: 'fullRebuild' } })
      await proc({ id: 'job-2', data: { type: 'updatePost', postId: 'post-001' } })

      expect(fullSpy).toHaveBeenCalled()
      expect(updSpy).toHaveBeenCalledWith('post-001')

      fullSpy.mockRestore()
      updSpy.mockRestore()
    })

    it('invokes completed/failed handlers', () => {
      const bullmq = require('bullmq')
      const completed = bullmq.__workerHandler('completed')
      const failed = bullmq.__workerHandler('failed')

      completed({ id: 'job-1' })
      failed({ id: 'job-2' }, new Error('nope'))

      expect(loggerMock.info).toHaveBeenCalled()
      expect(loggerMock.error).toHaveBeenCalled()
    })
  })

  // ── QUEUE and WORKER initialization ───────────────────────────────────────
  describe('static Queue and Worker', () => {
    it('exposes a QUEUE instance with an add method', () => {
      expect(KnowledgeGraphService.QUEUE).toBeDefined()
      expect(typeof KnowledgeGraphService.QUEUE.add).toBe('function')
    })

    it('exposes a WORKER instance', () => {
      expect(KnowledgeGraphService.WORKER).toBeDefined()
    })
  })
})
