jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  PutObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}))

jest.mock('sharp', () =>
  jest.fn().mockReturnValue({
    rotate: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('stripped-img')),
  })
)

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { CloudflareR2Service } from '@/services/StorageService/CloudflareR2Service'

const VALID_R2_CONFIG = {
  region: 'auto',
  accessKeyId: 'r2-access-key',
  secretAccessKey: 'r2-secret-key',
  bucket: 'r2-test-bucket',
  endpoint: 'https://test-account-id.r2.cloudflarestorage.com',
  forcePathStyle: true as const,
}

describe('CloudflareR2Service', () => {
  let mockSend: jest.Mock

  const originalEnv = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSend = jest.fn()
    ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

    process.env.R2_ACCOUNT_ID = 'test-account-id'
    process.env.R2_ACCESS_KEY_ID = 'r2-access-key'
    process.env.R2_SECRET_ACCESS_KEY = 'r2-secret-key'
    process.env.R2_BUCKET_NAME = 'r2-test-bucket'
    delete process.env.R2_PUBLIC_URL
  })

  afterAll(() => {
    Object.assign(process.env, originalEnv)
  })

  // ── constructor & config ─────────────────────────────────────────────
  describe('constructor', () => {
    it('constructs without error using env vars', () => {
      expect(() => new CloudflareR2Service()).not.toThrow()
    })

    it('constructs S3Client with forcePathStyle and R2 endpoint', () => {
      new CloudflareR2Service()
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: 'https://test-account-id.r2.cloudflarestorage.com',
          forcePathStyle: true,
        })
      )
    })

    it('accepts override config values', () => {
      expect(() => new CloudflareR2Service(VALID_R2_CONFIG)).not.toThrow()
    })

    it('throws when bucket is empty', () => {
      expect(() => new CloudflareR2Service({ ...VALID_R2_CONFIG, bucket: '' })).toThrow(
        'Cloudflare R2 configuration is missing required fields: bucket'
      )
    })

    it('throws when accessKeyId is empty', () => {
      expect(() => new CloudflareR2Service({ ...VALID_R2_CONFIG, accessKeyId: '' })).toThrow(
        'Cloudflare R2 configuration is missing required fields: accessKeyId'
      )
    })

    it('throws when secretAccessKey is empty', () => {
      expect(() => new CloudflareR2Service({ ...VALID_R2_CONFIG, secretAccessKey: '' })).toThrow(
        'Cloudflare R2 configuration is missing required fields: secretAccessKey'
      )
    })

    it('throws when required env vars are missing and no config override', () => {
      delete process.env.R2_ACCESS_KEY_ID
      delete process.env.R2_SECRET_ACCESS_KEY
      delete process.env.R2_BUCKET_NAME
      expect(() => new CloudflareR2Service()).toThrow(
        'Cloudflare R2 configuration is missing required fields'
      )
    })
  })

  // ── getPublicUrl ─────────────────────────────────────────────────────
  describe('getPublicUrl', () => {
    it('uses custom publicUrl when provided via config', () => {
      const service = new CloudflareR2Service({
        ...VALID_R2_CONFIG,
        publicUrl: 'https://cdn.example.com',
      })
      const url = (service as any).getPublicUrl('images/photo.jpg')
      expect(url).toBe('https://cdn.example.com/images/photo.jpg')
    })

    it('uses R2_PUBLIC_URL env var when no config publicUrl provided', () => {
      process.env.R2_PUBLIC_URL = 'https://files.mysite.com'
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const url = (service as any).getPublicUrl('posts/cover.png')
      expect(url).toBe('https://files.mysite.com/posts/cover.png')
    })

    it('falls back to R2 endpoint URL when no publicUrl is configured', () => {
      delete process.env.R2_PUBLIC_URL
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const url = (service as any).getPublicUrl('general/file.txt')
      // Should match the R2 storage URL pattern
      expect(url).toContain('r2.cloudflarestorage.com')
      expect(url).toContain('general/file.txt')
    })

    it('includes bucket in fallback URL', () => {
      delete process.env.R2_PUBLIC_URL
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const url = (service as any).getPublicUrl('images/photo.jpg')
      expect(url).toContain('r2-test-bucket')
    })
  })

  // ── uploadFile ───────────────────────────────────────────────────────
  describe('uploadFile', () => {
    const makeFile = (name: string, type: string): File =>
      new File(['content'], name, { type })

    it('returns the public URL on successful upload', async () => {
      mockSend.mockResolvedValue({})
      const service = new CloudflareR2Service({
        ...VALID_R2_CONFIG,
        publicUrl: 'https://cdn.example.com',
      })
      const file = makeFile('photo.jpg', 'image/jpeg')
      const url = await service.uploadFile(file, 'images')
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/images\//)
    })

    it('sends PutObjectCommand with correct bucket and content type', async () => {
      mockSend.mockResolvedValue({})
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const file = makeFile('doc.pdf', 'application/pdf')
      await service.uploadFile(file, 'files')
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'r2-test-bucket',
          ContentType: 'application/pdf',
        })
      )
    })

    it('defaults to general folder when none is specified', async () => {
      mockSend.mockResolvedValue({})
      const service = new CloudflareR2Service({
        ...VALID_R2_CONFIG,
        publicUrl: 'https://cdn.example.com',
      })
      const file = makeFile('photo.jpg', 'image/jpeg')
      const url = await service.uploadFile(file)
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/general\//)
    })

    it('throws for an invalid folder', async () => {
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const file = makeFile('photo.jpg', 'image/jpeg')
      await expect(service.uploadFile(file, 'bad-folder')).rejects.toThrow('INVALID_FOLDER_NAME')
    })

    it('throws for an unsupported file extension', async () => {
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const file = makeFile('malware.exe', 'application/octet-stream')
      await expect(service.uploadFile(file, 'general')).rejects.toThrow('Invalid file extension')
    })

    it('propagates S3 client errors on upload failure', async () => {
      mockSend.mockRejectedValue(new Error('R2 upload failed'))
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const file = makeFile('photo.jpg', 'image/jpeg')
      await expect(service.uploadFile(file, 'images')).rejects.toThrow('R2 upload failed')
    })
  })

  // ── deleteFile ───────────────────────────────────────────────────────
  describe('deleteFile', () => {
    it('returns true on successful delete', async () => {
      mockSend.mockResolvedValue({})
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const result = await service.deleteFile('images/photo.jpg')
      expect(result).toBe(true)
    })

    it('sends DeleteObjectCommand with correct Bucket and Key', async () => {
      mockSend.mockResolvedValue({})
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      await service.deleteFile('posts/cover.png')
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'r2-test-bucket',
        Key: 'posts/cover.png',
      })
    })

    it('propagates S3 errors on delete failure', async () => {
      mockSend.mockRejectedValue(new Error('R2 delete failed'))
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      await expect(service.deleteFile('images/secret.jpg')).rejects.toThrow('R2 delete failed')
    })
  })

  // ── getFileMetadata ──────────────────────────────────────────────────
  describe('getFileMetadata', () => {
    it('returns metadata when file exists', async () => {
      const lastModified = new Date('2026-02-01T00:00:00Z')
      mockSend.mockResolvedValue({
        ContentLength: 1024,
        ContentType: 'image/webp',
        LastModified: lastModified,
      })
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const result = await service.getFileMetadata('images/photo.webp')
      expect(result).toEqual({ size: 1024, contentType: 'image/webp', lastModified })
    })

    it('returns null when file is not found', async () => {
      mockSend.mockRejectedValue(new Error('NotFound'))
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const result = await service.getFileMetadata('images/missing.jpg')
      expect(result).toBeNull()
    })

    it('uses HeadObjectCommand with the correct key', async () => {
      mockSend.mockResolvedValue({ ContentLength: 512, ContentType: 'image/jpeg', LastModified: new Date() })
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      await service.getFileMetadata('users/avatar.jpg')
      expect(HeadObjectCommand).toHaveBeenCalledWith({
        Bucket: 'r2-test-bucket',
        Key: 'users/avatar.jpg',
      })
    })
  })

  // ── listFiles ────────────────────────────────────────────────────────
  describe('listFiles', () => {
    it('returns empty array when bucket is empty', async () => {
      mockSend.mockResolvedValue({ Contents: [] })
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const result = await service.listFiles()
      expect(result).toEqual([])
    })

    it('returns sorted file list by lastModified descending', async () => {
      const older = new Date('2026-01-01T00:00:00Z')
      const newer = new Date('2026-03-01T00:00:00Z')
      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'images/old.jpg', Size: 100, LastModified: older },
          { Key: 'images/new.jpg', Size: 200, LastModified: newer },
        ],
      })
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      const result = await service.listFiles()
      expect(result[0].key).toBe('images/new.jpg')
      expect(result[1].key).toBe('images/old.jpg')
    })

    it('passes folder prefix to ListObjectsV2Command', async () => {
      mockSend.mockResolvedValue({ Contents: [] })
      const service = new CloudflareR2Service(VALID_R2_CONFIG)
      await service.listFiles('videos')
      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({ Prefix: 'videos/' })
      )
    })
  })

  // ── static methods ───────────────────────────────────────────────────
  describe('static methods', () => {
    it('static allowedFolders mirrors BaseStorageProvider', () => {
      expect(CloudflareR2Service.allowedFolders).toContain('general')
      expect(CloudflareR2Service.allowedFolders).toContain('images')
    })

    it('static allowedExtensions mirrors BaseStorageProvider', () => {
      expect(CloudflareR2Service.allowedExtensions).toContain('jpg')
      expect(CloudflareR2Service.allowedExtensions).toContain('pdf')
    })

    it('static allowedMimeTypes mirrors BaseStorageProvider', () => {
      expect(CloudflareR2Service.allowedMimeTypes).toContain('image/jpeg')
      expect(CloudflareR2Service.allowedMimeTypes).toContain('application/pdf')
    })

    it('static uploadFile, deleteFile, listFiles are functions', () => {
      expect(typeof CloudflareR2Service.uploadFile).toBe('function')
      expect(typeof CloudflareR2Service.deleteFile).toBe('function')
      expect(typeof CloudflareR2Service.listFiles).toBe('function')
      expect(typeof CloudflareR2Service.getFileMetadata).toBe('function')
    })
  })
})
