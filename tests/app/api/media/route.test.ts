jest.mock('@/services/AuthService/AuthMiddleware', () => ({
  __esModule: true,
  default: {
    authenticateUserByRequest: jest.fn(),
  },
}))

jest.mock('@/services/StorageService/AWSService', () => ({
  __esModule: true,
  default: {
    allowedFolders: ['general', 'posts'],
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    listFiles: jest.fn(),
  },
}))

jest.mock('@/libs/prisma', () => ({
  prisma: {
    media: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import AWSService from '@/services/StorageService/AWSService'
import { prisma } from '@/libs/prisma'
import { POST, DELETE } from '@/app/(api)/api/media/route'

const authMock = AuthMiddleware as jest.Mocked<typeof AuthMiddleware>
const awsMock = AWSService as jest.Mocked<typeof AWSService>
const prismaMock = prisma as any

describe('api/media route partial failures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authMock.authenticateUserByRequest.mockResolvedValue({
      user: { userId: 'user-1' },
      userSession: { userSessionId: 'sess-1' },
    } as any)
  })

  describe('POST', () => {
    it('rolls back uploaded storage object when DB save fails', async () => {
      const file = new File([Buffer.from('test')], 'avatar.jpg', { type: 'image/jpeg' })

      awsMock.uploadFile.mockResolvedValueOnce('https://bucket.s3.amazonaws.com/general/file.jpg')
      awsMock.deleteFile.mockResolvedValueOnce(true)
      prismaMock.media.create.mockRejectedValueOnce(new Error('db create failed'))

      const request = {
        formData: jest.fn().mockResolvedValue({
          get: (key: string) => {
            if (key === 'file') return file
            if (key === 'folder') return 'general'
            return null
          },
        }),
      } as any

      const response = await POST(request)
      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(awsMock.deleteFile).toHaveBeenCalledWith('general/file.jpg')
      expect(payload.message).toBe('db create failed')
    })
  })

  describe('DELETE', () => {
    it('restores DB record when storage deletion fails after DB delete', async () => {
      const existing = {
        key: 'general/file.jpg',
        url: 'https://bucket.s3.amazonaws.com/general/file.jpg',
        folder: 'general',
        mimeType: 'image/jpeg',
        size: 128,
        name: 'Avatar',
        altText: 'avatar alt',
        originalName: 'avatar.jpg',
        uploadedBy: 'user-1',
      }

      prismaMock.media.findFirst.mockResolvedValueOnce(existing)
      prismaMock.media.deleteMany.mockResolvedValueOnce({ count: 1 })
      prismaMock.media.upsert.mockResolvedValueOnce(existing)
      awsMock.deleteFile.mockRejectedValueOnce(new Error('s3 delete failed'))

      const request = {
        json: jest.fn().mockResolvedValue({ key: 'general/file.jpg' }),
      } as any

      const response = await DELETE(request)
      const payload = await response.json()

      expect(response.status).toBe(500)
      expect(prismaMock.media.upsert).toHaveBeenCalled()
      expect(payload.message).toBe('s3 delete failed')
    })
  })
})
