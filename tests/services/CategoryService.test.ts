import CategoryService from '@/services/CategoryService'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    category: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

const prismaMock = prisma as any

const mockCategory = {
  categoryId: 'cat-1',
  title: 'Tech',
  description: 'Technology articles',
  slug: 'tech',
  image: 'tech.jpg',
  keywords: ['tech', 'code'],
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [],
}

beforeEach(() => jest.resetAllMocks())

describe('CategoryService.createCategory', () => {
  it('throws when required fields are missing', async () => {
    await expect(
      CategoryService.createCategory({ title: '', description: 'desc', slug: 'slug', image: 'img.jpg' }),
    ).rejects.toThrow('All fields are required.')
  })

  it('throws when category with same title or slug exists', async () => {
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(mockCategory)
    await expect(
      CategoryService.createCategory({ title: 'Tech', description: 'desc', slug: 'tech', image: 'img.jpg' }),
    ).rejects.toThrow('Category with the same name or slug already exists.')
  })

  it('creates category when valid data is provided', async () => {
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.category.create as jest.Mock).mockResolvedValue(mockCategory)

    const result = await CategoryService.createCategory({
      title: 'Tech',
      description: 'Technology articles',
      slug: 'tech',
      image: 'tech.jpg',
      keywords: ['tech'],
    })

    expect(prismaMock.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'Tech', slug: 'tech' }) }),
    )
    expect(result).toEqual(mockCategory)
  })

  it('normalizes slug before create', async () => {
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.category.create as jest.Mock).mockResolvedValue(mockCategory)

    await CategoryService.createCategory({
      title: 'Tech',
      description: 'Technology articles',
      slug: '  Tech   News  ',
      image: 'tech.jpg',
      keywords: ['tech'],
    })

    expect(prismaMock.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'tech-news' }),
      })
    )
  })
})

describe('CategoryService.getAllCategories', () => {
  it('throws on SQL injection in search', async () => {
    await expect(CategoryService.getAllCategories(0, 10, 'SELECT * FROM')).rejects.toThrow(
      'Invalid search query.',
    )
  })

  it('returns categories and total with deletedAt: null filter', async () => {
    ;(prismaMock.category.findMany as jest.Mock).mockResolvedValue([mockCategory])
    ;(prismaMock.category.count as jest.Mock).mockResolvedValue(1)

    const result = await CategoryService.getAllCategories(0, 10)

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
    )
    expect(result).toEqual({ categories: [mockCategory], total: 1 })
  })

  it('applies pagination correctly', async () => {
    ;(prismaMock.category.findMany as jest.Mock).mockResolvedValue([])
    ;(prismaMock.category.count as jest.Mock).mockResolvedValue(0)

    await CategoryService.getAllCategories(2, 5)

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    )
  })

  it('normalizes pagination bounds for negative page and zero pageSize', async () => {
    ;(prismaMock.category.findMany as jest.Mock).mockResolvedValue([])
    ;(prismaMock.category.count as jest.Mock).mockResolvedValue(0)

    await CategoryService.getAllCategories(-5, 0)

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 1 }),
    )
  })

  it('caps pageSize to max boundary', async () => {
    ;(prismaMock.category.findMany as jest.Mock).mockResolvedValue([])
    ;(prismaMock.category.count as jest.Mock).mockResolvedValue(0)

    await CategoryService.getAllCategories(0, 5000)

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    )
  })
})

describe('CategoryService.getCategoryById', () => {
  it('returns null when category is not found', async () => {
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(null)
    const result = await CategoryService.getCategoryById('nonexistent')
    expect(result).toBeNull()
  })

  it('returns translated category when lang is provided', async () => {
    const categoryWithTranslation = {
      ...mockCategory,
      translations: [{ id: 't1', categoryId: 'cat-1', lang: 'tr', title: 'Teknoloji', description: 'Teknoloji makaleleri', slug: 'teknoloji' }],
    }
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(categoryWithTranslation)

    const result = await CategoryService.getCategoryById('cat-1', 'tr')
    expect(result?.title).toBe('Teknoloji')
  })
})

describe('CategoryService.updateCategory', () => {
  it('calls prisma.category.update with correct data', async () => {
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(null)
    const updated = { ...mockCategory, title: 'Updated Tech' }
    ;(prismaMock.category.update as jest.Mock).mockResolvedValue(updated)

    const result = await CategoryService.updateCategory({
      categoryId: 'cat-1',
      title: 'Updated Tech',
      description: 'desc',
      slug: 'tech',
      image: 'img.jpg',
    })

    expect(prismaMock.category.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { categoryId: 'cat-1' } }),
    )
    expect(result.title).toBe('Updated Tech')
  })

  it('denies non-admin update when auth context is provided', async () => {
    await expect(
      CategoryService.updateCategory(
        {
          categoryId: 'cat-1',
          title: 'Updated Tech',
          description: 'desc',
          slug: 'tech',
          image: 'img.jpg',
        },
        { requesterRole: 'USER' }
      )
    ).rejects.toThrow('Forbidden.')
  })

  it('throws when update slug conflicts with another active category', async () => {
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValueOnce({
      categoryId: 'cat-2',
      slug: 'tech',
      deletedAt: null,
    })

    await expect(
      CategoryService.updateCategory(
        {
          categoryId: 'cat-1',
          title: 'Updated Tech',
          description: 'desc',
          slug: 'tech',
          image: 'img.jpg',
        },
        { requesterRole: 'ADMIN' }
      )
    ).rejects.toThrow('Category with the same name or slug already exists.')
  })
})

describe('CategoryService.deleteCategory', () => {
  it('soft deletes by setting deletedAt via update', async () => {
    ;(prismaMock.category.update as jest.Mock).mockResolvedValue({ ...mockCategory, deletedAt: new Date() })

    await CategoryService.deleteCategory('cat-1')

    expect(prismaMock.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoryId: 'cat-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    )
    expect(prismaMock.category.findFirst).not.toHaveBeenCalled()
  })

  it('denies non-admin delete when auth context is provided', async () => {
    await expect(CategoryService.deleteCategory('cat-1', { requesterRole: 'USER' })).rejects.toThrow(
      'Forbidden.'
    )
  })
})

describe('CategoryService.getCategoryBySlug', () => {
  it('returns null when no category matches the slug', async () => {
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(null)
    const result = await CategoryService.getCategoryBySlug('nonexistent')
    expect(result).toBeNull()
  })

  it('returns category when slug is found (default en lang)', async () => {
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(mockCategory)
    const result = await CategoryService.getCategoryBySlug('tech')
    expect(result).not.toBeNull()
    expect(result!.title).toBe('Tech')
  })

  it('applies translation when matching lang exists', async () => {
    const categoryWithTranslation = {
      ...mockCategory,
      translations: [
        { id: 't1', categoryId: 'cat-1', lang: 'tr', title: 'Teknoloji', description: 'Teknoloji makaleleri', slug: 'teknoloji' },
      ],
    }
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(categoryWithTranslation)
    const result = await CategoryService.getCategoryBySlug('tech', 'tr')
    expect(result!.title).toBe('Teknoloji')
  })

  it('returns original when no translation exists for requested lang', async () => {
    const categoryWithTranslation = {
      ...mockCategory,
      translations: [
        { id: 't1', categoryId: 'cat-1', lang: 'de', title: 'Technologie', description: 'desc', slug: 'technologie' },
      ],
    }
    ;(prismaMock.category.findFirst as jest.Mock).mockResolvedValue(categoryWithTranslation)
    const result = await CategoryService.getCategoryBySlug('tech', 'tr')
    // falls back to original because no 'tr' translation exists
    expect(result!.title).toBe('Tech')
  })
})

describe('CategoryService.deleteAllCategories', () => {
  it('calls prisma.category.updateMany with deletedAt set', async () => {
    ;(prismaMock.category.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

    await CategoryService.deleteAllCategories()

    expect(prismaMock.category.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    )
  })

  it('returns undefined on success', async () => {
    ;(prismaMock.category.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    const result = await CategoryService.deleteAllCategories()
    expect(result).toBeUndefined()
  })
})

describe('CategoryService.getAllCategorySlugs', () => {
  it('returns array of slug and updatedAt pairs', async () => {
    const mockSlugs = [
      { slug: 'tech', updatedAt: new Date() },
      { slug: 'science', updatedAt: null },
    ]
    ;(prismaMock.category.findMany as jest.Mock).mockResolvedValue(mockSlugs)

    const result = await CategoryService.getAllCategorySlugs()

    expect(result).toHaveLength(2)
    expect(result[0].slug).toBe('tech')
    expect(result[1].slug).toBe('science')
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
    )
  })

  it('returns empty array when no active categories exist', async () => {
    ;(prismaMock.category.findMany as jest.Mock).mockResolvedValue([])
    const result = await CategoryService.getAllCategorySlugs()
    expect(result).toEqual([])
  })
})

describe('CategoryService.getAllCategories – sort key resolution', () => {
  beforeEach(() => {
    ;(prismaMock.category.findMany as jest.Mock).mockResolvedValue([])
    ;(prismaMock.category.count as jest.Mock).mockResolvedValue(0)
  })

  it('uses "title" sort key when explicitly provided', async () => {
    await CategoryService.getAllCategories(0, 10, undefined, 'title', 'asc')
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { title: 'asc' } }),
    )
  })

  it('uses "slug" sort key when explicitly provided', async () => {
    await CategoryService.getAllCategories(0, 10, undefined, 'slug', 'desc')
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { slug: 'desc' } }),
    )
  })

  it('uses "updatedAt" sort key when explicitly provided', async () => {
    await CategoryService.getAllCategories(0, 10, undefined, 'updatedAt', 'asc')
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updatedAt: 'asc' } }),
    )
  })

  it('falls back to "createdAt" for an unrecognised sort key', async () => {
    await CategoryService.getAllCategories(0, 10, undefined, 'nonexistent_key', 'asc')
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
    )
  })

  it('falls back to "createdAt" when no sort key is provided', async () => {
    await CategoryService.getAllCategories(0, 10)
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    )
  })

  it('defaults sort direction to "desc" for unrecognised sortDir value', async () => {
    await CategoryService.getAllCategories(0, 10, undefined, 'title', 'desc')
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { title: 'desc' } }),
    )
  })
})
