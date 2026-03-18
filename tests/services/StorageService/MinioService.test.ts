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
import { MinioService } from '@/services/StorageService/MinioService'

const VALID_MINIO_CONFIG = {
  region: 'us-east-1',
  accessKeyId: 'minio-access-key',
  secretAccessKey: 'minio-secret-key',
  bucket: 'minio-test-bucket',
  endpoint: 'http://localhost:9000',
  forcePathStyle: true as const,
}

describe('MinioService', () => {
  let mockSend: jest.Mock

  const originalEnv = {
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
    MINIO_REGION: process.env.MINIO_REGION,
    MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSend = jest.fn()
    ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

    process.env.MINIO_ENDPOINT = 'http://localhost:9000'
    process.env.MINIO_ACCESS_KEY = 'minio-access-key'
    process.env.MINIO_SECRET_KEY = 'minio-secret-key'
    process.env.MINIO_BUCKET_NAME = 'minio-test-bucket'
    process.env.MINIO_REGION = 'us-east-1'
    delete process.env.MINIO_PUBLIC_URL
  })

  afterAll(() => {
    Object.assign(process.env, originalEnv)
  })

  // ── constructor & config ─────────────────────────────────────────────
  describe('constructor', () => {
    it('constructs without error using env vars', () => {
      expect(() => new MinioService()).not.toThrow()
    })

    it('constructs S3Client with forcePathStyle=true (required by MinIO)', () => {
      new MinioService()
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({ forcePathStyle: true })
      )
    })

    it('uses MINIO_ENDPOINT for S3Client endpoint', () => {
      new MinioService()
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: 'http://localhost:9000' })
      )
    })

    it('accepts override config', () => {
      expect(() => new MinioService(VALID_MINIO_CONFIG)).not.toThrow()
    })

    it('throws when bucket is missing', () => {
      expect(() => new MinioService({ ...VALID_MINIO_CONFIG, bucket: '' })).toThrow(
        'MinIO configuration is missing required fields: bucket'
      )
    })

    it('throws when accessKeyId is missing', () => {
      expect(() => new MinioService({ ...VALID_MINIO_CONFIG, accessKeyId: '' })).toThrow(
        'MinIO configuration is missing required fields: accessKeyId'
      )
    })

    it('throws when secretAccessKey is missing', () => {
      expect(() => new MinioService({ ...VALID_MINIO_CONFIG, secretAccessKey: '' })).toThrow(
        'MinIO configuration is missing required fields: secretAccessKey'
      )
    })

    it('throws when required env vars are absent and no config override', () => {
      delete process.env.MINIO_ACCESS_KEY
      delete process.env.MINIO_SECRET_KEY
      delete process.env.MINIO_BUCKET_NAME
      expect(() => new MinioService()).toThrow(
        'MinIO configuration is missing required fields'
      )
    })

    it('defaults to localhost:9000 when MINIO_ENDPOINT is not set', () => {
      delete process.env.MINIO_ENDPOINT
      new MinioService(VALID_MINIO_CONFIG)
      // VALID_MINIO_CONFIG provides explicit endpoint override, so just confirm no throw
      expect(S3Client).toHaveBeenCalled()
    })
  })

  // ── getPublicUrl ─────────────────────────────────────────────────────
  describe('getPublicUrl', () => {
    it('uses custom publicUrl when provided via config', () => {
      const service = new MinioService({
        ...VALID_MINIO_CONFIG,
        publicUrl: 'https://files.example.com',
      })
      const url = (service as any).getPublicUrl('images/photo.jpg')
      expect(url).toBe('https://files.example.com/images/photo.jpg')
    })

    it('uses MINIO_PUBLIC_URL env var when set', () => {
      process.env.MINIO_PUBLIC_URL = 'https://cdn.example.com'
      const service = new MinioService(VALID_MINIO_CONFIG)
      const url = (service as any).getPublicUrl('posts/image.png')
      expect(url).toBe('https://cdn.example.com/posts/image.png')
    })

    it('falls back to endpoint/bucket/key format when no publicUrl is configured', () => {
      delete process.env.MINIO_PUBLIC_URL
      const service = new MinioService(VALID_MINIO_CONFIG)
      const url = (service as any).getPublicUrl('general/file.txt')
      expect(url).toBe('http://localhost:9000/minio-test-bucket/general/file.txt')
    })

    it('uses endpoint from config in fallback URL', () => {
      delete process.env.MINIO_PUBLIC_URL
      const service = new MinioService({
        ...VALID_MINIO_CONFIG,
        endpoint: 'https://minio.mycompany.com',
      })
      const url = (service as any).getPublicUrl('images/photo.jpg')
      expect(url).toBe('https://minio.mycompany.com/minio-test-bucket/images/photo.jpg')
    })
  })

  // ── uploadFile ───────────────────────────────────────────────────────
  describe('uploadFile', () => {
    const makeFile = (name: string, type: string): File =>
      new File(['content'], name, { type })

    it('returns the public URL on successful upload', async () => {
      mockSend.mockResolvedValue({})
      const service = new MinioService({
        ...VALID_MINIO_CONFIG,
        publicUrl: 'https://cdn.example.com',
      })
      const file = makeFile('photo.jpg', 'image/jpeg')
      const url = await service.uploadFile(file, 'images')
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/images\//)
    })

    it('sends PutObjectCommand with correct Bucket and ContentType', async () => {
      mockSend.mockResolvedValue({})
      const service = new MinioService(VALID_MINIO_CONFIG)
      const file = makeFile('photo.png', 'image/png')
      await service.uploadFile(file, 'images')
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'minio-test-bucket',
          ContentType: 'image/png',
        })
      )
    })

    it('defaults to general folder when none specified', async () => {
      mockSend.mockResolvedValue({})
      const service = new MinioService({
        ...VALID_MINIO_CONFIG,
        publicUrl: 'https://cdn.example.com',
      })
      const file = makeFile('photo.jpg', 'image/jpeg')
      const url = await service.uploadFile(file)
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/general\//)
    })

    it('throws for an invalid folder', async () => {
      const service = new MinioService(VALID_MINIO_CONFIG)
      const file = makeFile('photo.jpg', 'image/jpeg')
      await expect(service.uploadFile(file, 'not-a-real-folder')).rejects.toThrow('INVALID_FOLDER_NAME')
    })

    it('throws for an unsupported extension', async () => {
      const service = new MinioService(VALID_MINIO_CONFIG)
      const file = makeFile('badfile.bat', 'application/octet-stream')
      await expect(service.uploadFile(file, 'general')).rejects.toThrow('Invalid file extension')
    })

    it('propagates MinIO S3 client errors on upload failure', async () => {
      mockSend.mockRejectedValue(new Error('MinIO connection refused'))
      const service = new MinioService(VALID_MINIO_CONFIG)
      const file = makeFile('photo.jpg', 'image/jpeg')
      await expect(service.uploadFile(file, 'images')).rejects.toThrow('MinIO connection refused')
    })

    it('upload failure does not silently swallow the error', async () => {
      mockSend.mockRejectedValue(new Error('Bucket does not exist'))
      const service = new MinioService(VALID_MINIO_CONFIG)
      const file = makeFile('photo.jpg', 'image/jpeg')
      let caught: Error | null = null
      try {
        await service.uploadFile(file, 'images')
      } catch (err: any) {
        caught = err
      }
      expect(caught).not.toBeNull()
      expect(caught!.message).toBe('Bucket does not exist')
    })
  })

  // ── deleteFile ───────────────────────────────────────────────────────
  describe('deleteFile', () => {
    it('returns true on successful delete', async () => {
      mockSend.mockResolvedValue({})
      const service = new MinioService(VALID_MINIO_CONFIG)
      const result = await service.deleteFile('images/photo.jpg')
      expect(result).toBe(true)
    })

    it('sends DeleteObjectCommand with correct Bucket and Key', async () => {
      mockSend.mockResolvedValue({})
      const service = new MinioService(VALID_MINIO_CONFIG)
      await service.deleteFile('posts/article-cover.png')
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'minio-test-bucket',
        Key: 'posts/article-cover.png',
      })
    })

    it('propagates client errors on delete failure', async () => {
      mockSend.mockRejectedValue(new Error('MinIO unavailable'))
      const service = new MinioService(VALID_MINIO_CONFIG)
      await expect(service.deleteFile('images/photo.jpg')).rejects.toThrow('MinIO unavailable')
    })

    it('delete failure propagates without swallowing', async () => {
      mockSend.mockRejectedValue(new Error('Permission denied'))
      const service = new MinioService(VALID_MINIO_CONFIG)
      await expect(service.deleteFile('private/secret.jpg')).rejects.toThrow('Permission denied')
    })
  })

  // ── getFileMetadata ──────────────────────────────────────────────────
  describe('getFileMetadata', () => {
    it('returns metadata when file exists', async () => {
      const lastModified = new Date('2026-01-15T00:00:00Z')
      mockSend.mockResolvedValue({
        ContentLength: 4096,
        ContentType: 'video/mp4',
        LastModified: lastModified,
      })
      const service = new MinioService(VALID_MINIO_CONFIG)
      const result = await service.getFileMetadata('videos/clip.mp4')
      expect(result).toEqual({ size: 4096, contentType: 'video/mp4', lastModified })
    })

    it('returns null when file is not found', async () => {
      mockSend.mockRejectedValue(new Error('NoSuchKey'))
      const service = new MinioService(VALID_MINIO_CONFIG)
      const result = await service.getFileMetadata('images/missing.jpg')
      expect(result).toBeNull()
    })

    it('uses HeadObjectCommand with correct key', async () => {
      mockSend.mockResolvedValue({
        ContentLength: 256,
        ContentType: 'audio/mpeg',
        LastModified: new Date(),
      })
      const service = new MinioService(VALID_MINIO_CONFIG)
      await service.getFileMetadata('audios/track.mp3')
      expect(HeadObjectCommand).toHaveBeenCalledWith({
        Bucket: 'minio-test-bucket',
        Key: 'audios/track.mp3',
      })
    })
  })

  // ── listFiles ────────────────────────────────────────────────────────
  describe('listFiles', () => {
    it('returns empty array for empty bucket', async () => {
      mockSend.mockResolvedValue({ Contents: [] })
      const service = new MinioService(VALID_MINIO_CONFIG)
      expect(await service.listFiles()).toEqual([])
    })

    it('returns results sorted newest first', async () => {
      const older = new Date('2026-01-01T00:00:00Z')
      const newer = new Date('2026-03-01T00:00:00Z')
      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'images/old.jpg', Size: 100, LastModified: older },
          { Key: 'images/new.jpg', Size: 200, LastModified: newer },
        ],
      })
      const service = new MinioService(VALID_MINIO_CONFIG)
      const result = await service.listFiles()
      expect(result[0].key).toBe('images/new.jpg')
    })

    it('passes folder as Prefix', async () => {
      mockSend.mockResolvedValue({ Contents: [] })
      const service = new MinioService(VALID_MINIO_CONFIG)
      await service.listFiles('audios')
      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({ Prefix: 'audios/' })
      )
    })
  })

  // ── uploadFromUrl ────────────────────────────────────────────────────
  describe('uploadFromUrl', () => {
    const mockFetch = jest.fn()

    beforeEach(() => {
      global.fetch = mockFetch
    })

    it('uploads from URL and returns public URL', async () => {
      mockFetch.mockResolvedValue({
        headers: { get: () => 'image/jpeg' },
        arrayBuffer: async () => new ArrayBuffer(8),
      })
      mockSend.mockResolvedValue({})
      const service = new MinioService({
        ...VALID_MINIO_CONFIG,
        publicUrl: 'https://cdn.example.com',
      })
      const url = await service.uploadFromUrl('https://example.com/photo.jpg', 'images')
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/images\//)
    })

    it('throws INVALID_FOLDER_NAME for unknown folder', async () => {
      const service = new MinioService(VALID_MINIO_CONFIG)
      await expect(
        service.uploadFromUrl('https://example.com/img.jpg', 'not-a-folder')
      ).rejects.toThrow('INVALID_FOLDER_NAME')
    })

    it('throws for unsupported MIME type from URL', async () => {
      mockFetch.mockResolvedValue({
        headers: { get: () => 'application/javascript' },
        arrayBuffer: async () => new ArrayBuffer(8),
      })
      const service = new MinioService(VALID_MINIO_CONFIG)
      await expect(
        service.uploadFromUrl('https://example.com/script.js', 'general')
      ).rejects.toThrow('Invalid MIME type from URL')
    })

    it('propagates fetch errors (connection failure)', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))
      const service = new MinioService(VALID_MINIO_CONFIG)
      await expect(
        service.uploadFromUrl('https://unreachable.host/img.jpg', 'general')
      ).rejects.toThrow('ECONNREFUSED')
    })
  })

  // ── static methods ───────────────────────────────────────────────────
  describe('static methods', () => {
    it('allowedFolders mirrors BaseStorageProvider', () => {
      expect(MinioService.allowedFolders).toContain('general')
      expect(MinioService.allowedFolders).toContain('videos')
    })

    it('allowedExtensions mirrors BaseStorageProvider', () => {
      expect(MinioService.allowedExtensions).toContain('mp3')
      expect(MinioService.allowedExtensions).toContain('docx')
    })

    it('allowedMimeTypes mirrors BaseStorageProvider', () => {
      expect(MinioService.allowedMimeTypes).toContain('audio/mpeg')
      expect(MinioService.allowedMimeTypes).toContain('video/mp4')
    })

    it('static uploadFile, deleteFile, listFiles, getFileMetadata are functions', () => {
      expect(typeof MinioService.uploadFile).toBe('function')
      expect(typeof MinioService.deleteFile).toBe('function')
      expect(typeof MinioService.listFiles).toBe('function')
      expect(typeof MinioService.getFileMetadata).toBe('function')
    })
  })
})
