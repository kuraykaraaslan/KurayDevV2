import SeriesService from '@/services/PostService/SeriesService'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    postSeries: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    postSeriesEntry: {
      count: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const prismaMock = prisma as any

const mockSeries = {
  id: 'series-1',
  title: 'My Series',
  slug: 'my-series',
  description: 'A test series',
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  entries: [],
}

const mockEntry = {
  id: 'entry-1',
  order: 0,
  postId: 'post-1',
  seriesId: 'series-1',
  post: { postId: 'post-1', title: 'Post Title', slug: 'post-title', status: 'PUBLISHED', image: null, category: null },
}

beforeEach(() => jest.resetAllMocks())

describe('SeriesService.getAll', () => {
  it('calls $transaction and filters by deletedAt: null', async () => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValue([[mockSeries], 1])

    const result = await SeriesService.getAll(0, 10)

    expect(prismaMock.$transaction).toHaveBeenCalled()
    expect(result).toEqual({ series: [mockSeries], total: 1 })
  })

  it('applies search filter when provided', async () => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValue([[], 0])

    await SeriesService.getAll(0, 10, 'test search')

    expect(prismaMock.$transaction).toHaveBeenCalled()
  })
})

describe('SeriesService.getById', () => {
  it('calls postSeries.findFirst with id and deletedAt: null', async () => {
    ;(prismaMock.postSeries.findFirst as jest.Mock).mockResolvedValue(mockSeries)

    const result = await SeriesService.getById('series-1')

    expect(prismaMock.postSeries.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'series-1', deletedAt: null } }),
    )
    expect(result).toEqual(mockSeries)
  })
})

describe('SeriesService.create', () => {
  it('throws when a series with the slug already exists', async () => {
    ;(prismaMock.postSeries.findFirst as jest.Mock).mockResolvedValue(mockSeries)

    await expect(
      SeriesService.create({ title: 'My Series', slug: 'my-series', description: 'desc' }),
    ).rejects.toThrow('A series with this slug already exists.')
  })

  it('creates series when slug is unique', async () => {
    ;(prismaMock.postSeries.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.postSeries.create as jest.Mock).mockResolvedValue(mockSeries)

    const result = await SeriesService.create({ title: 'My Series', slug: 'my-series', description: 'desc' })

    expect(prismaMock.postSeries.create).toHaveBeenCalled()
    expect(result).toEqual(mockSeries)
  })
})

describe('SeriesService.update', () => {
  it('calls postSeries.update with correct id and data', async () => {
    const updated = { ...mockSeries, title: 'Updated Series' }
    ;(prismaMock.postSeries.update as jest.Mock).mockResolvedValue(updated)

    const result = await SeriesService.update('series-1', { title: 'Updated Series', slug: 'my-series' })

    expect(prismaMock.postSeries.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'series-1' } }),
    )
    expect(result).toEqual(updated)
  })
})

describe('SeriesService.delete', () => {
  it('soft deletes by setting deletedAt via update', async () => {
    ;(prismaMock.postSeries.update as jest.Mock).mockResolvedValue({ ...mockSeries, deletedAt: new Date() })

    await SeriesService.delete('series-1')

    expect(prismaMock.postSeries.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'series-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    )
  })
})

describe('SeriesService.addPost', () => {
  it('upserts postSeriesEntry with correct seriesId, postId, and order', async () => {
    ;(prismaMock.postSeriesEntry.count as jest.Mock).mockResolvedValue(2)
    ;(prismaMock.postSeriesEntry.upsert as jest.Mock).mockResolvedValue(mockEntry)

    const result = await SeriesService.addPost('series-1', 'post-1')

    expect(prismaMock.postSeriesEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { postId: 'post-1' },
        create: expect.objectContaining({ seriesId: 'series-1', postId: 'post-1', order: 2 }),
        update: expect.objectContaining({ seriesId: 'series-1', order: 2 }),
      }),
    )
    expect(result).toEqual(mockEntry)
  })

  it('uses explicit order when provided', async () => {
    ;(prismaMock.postSeriesEntry.upsert as jest.Mock).mockResolvedValue(mockEntry)

    await SeriesService.addPost('series-1', 'post-1', 5)

    expect(prismaMock.postSeriesEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ order: 5 }),
        update: expect.objectContaining({ order: 5 }),
      }),
    )
    expect(prismaMock.postSeriesEntry.count).not.toHaveBeenCalled()
  })
})

describe('SeriesService.removePost', () => {
  it('calls postSeriesEntry.delete with the postId', async () => {
    ;(prismaMock.postSeriesEntry.delete as jest.Mock).mockResolvedValue(mockEntry)

    await SeriesService.removePost('post-1')

    expect(prismaMock.postSeriesEntry.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { postId: 'post-1' } }),
    )
  })
})

describe('SeriesService.getBySlug', () => {
  it('returns null when no series matches the slug', async () => {
    ;(prismaMock.postSeries.findFirst as jest.Mock).mockResolvedValue(null)

    const result = await SeriesService.getBySlug('nonexistent-slug')

    expect(prismaMock.postSeries.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'nonexistent-slug', deletedAt: null } }),
    )
    expect(result).toBeNull()
  })

  it('returns series when slug is found', async () => {
    ;(prismaMock.postSeries.findFirst as jest.Mock).mockResolvedValue(mockSeries)

    const result = await SeriesService.getBySlug('my-series')

    expect(prismaMock.postSeries.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'my-series', deletedAt: null } }),
    )
    expect(result).toEqual(mockSeries)
  })
})

describe('SeriesService.getById – not-found path', () => {
  it('returns null when no series matches the id', async () => {
    ;(prismaMock.postSeries.findFirst as jest.Mock).mockResolvedValue(null)

    const result = await SeriesService.getById('nonexistent-id')

    expect(result).toBeNull()
  })
})

describe('SeriesService.getAll – sort key resolution', () => {
  beforeEach(() => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValue([[], 0])
  })

  it('uses "title" sort key when explicitly provided', async () => {
    await SeriesService.getAll(0, 10, undefined, 'title', 'asc')
    expect(prismaMock.postSeries.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { title: 'asc' } }),
    )
  })

  it('uses "slug" sort key when explicitly provided', async () => {
    await SeriesService.getAll(0, 10, undefined, 'slug', 'desc')
    expect(prismaMock.postSeries.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { slug: 'desc' } }),
    )
  })

  it('uses "updatedAt" sort key when explicitly provided', async () => {
    await SeriesService.getAll(0, 10, undefined, 'updatedAt', 'asc')
    expect(prismaMock.postSeries.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updatedAt: 'asc' } }),
    )
  })

  it('falls back to "createdAt" for an unrecognised sort key', async () => {
    await SeriesService.getAll(0, 10, undefined, 'invalid_key', 'asc')
    expect(prismaMock.postSeries.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
    )
  })

  it('defaults sort direction to "desc" when not asc', async () => {
    await SeriesService.getAll(0, 10)
    expect(prismaMock.postSeries.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    )
  })
})

describe('SeriesService.reorderPosts', () => {
  it('calls $transaction with update calls for each entry then returns updated series', async () => {
    const updatedEntry1 = { ...mockEntry, order: 0 }
    const updatedEntry2 = { ...mockEntry, id: 'entry-2', postId: 'post-2', order: 1 }

    // reorderPosts calls $transaction then getById (which calls postSeries.findFirst)
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValue([updatedEntry1, updatedEntry2])
    ;(prismaMock.postSeries.findFirst as jest.Mock).mockResolvedValue(mockSeries)

    const result = await SeriesService.reorderPosts('series-1', [
      { postId: 'post-1', order: 0 },
      { postId: 'post-2', order: 1 },
    ])

    expect(prismaMock.$transaction).toHaveBeenCalled()
    // The transaction array contains postSeriesEntry.update calls
    const txCall = (prismaMock.$transaction as jest.Mock).mock.calls[0][0]
    expect(Array.isArray(txCall)).toBe(true)
    expect(txCall).toHaveLength(2)

    // After reordering, getById is called to return the updated series
    expect(prismaMock.postSeries.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'series-1', deletedAt: null } }),
    )
    expect(result).toEqual(mockSeries)
  })

  it('calls $transaction with empty array when entries list is empty', async () => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValue([])
    ;(prismaMock.postSeries.findFirst as jest.Mock).mockResolvedValue(mockSeries)

    await SeriesService.reorderPosts('series-1', [])

    const txCall = (prismaMock.$transaction as jest.Mock).mock.calls[0][0]
    expect(txCall).toHaveLength(0)
  })
})
