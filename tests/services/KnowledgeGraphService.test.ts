// KnowledgeGraphService instantiates BullMQ Queue + Worker at module load time,
// so they must be mocked before any import of the service.

jest.mock('bullmq', () => {
  const add      = jest.fn().mockResolvedValue({ id: 'job-1' })
  const on       = jest.fn()
  const Queue    = jest.fn().mockImplementation(() => ({ add, on }))
  const Worker   = jest.fn().mockImplementation(() => ({ on }))
  return { Queue, Worker }
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
import { cosine } from '@/helpers/Cosine'

const redisMock       = redis as jest.Mocked<typeof redis>
const postServiceMock = PostService as jest.Mocked<typeof PostService>
const cosineMock      = cosine as jest.MockedFunction<typeof cosine>

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
