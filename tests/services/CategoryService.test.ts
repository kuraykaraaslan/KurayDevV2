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
})
