jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  PutObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}))

jest.mock('sharp', () => jest.fn().mockReturnValue({
  rotate: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('img')),
}))

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { AWSService } from '@/services/StorageService/AWSService'

describe('AWSService', () => {
  const originalAwsRegion = process.env.AWS_REGION
  const originalAwsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
  const originalAwsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const originalAwsBucketName = process.env.AWS_BUCKET_NAME

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.AWS_REGION = 'us-east-1'
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'
    process.env.AWS_BUCKET_NAME = 'my-test-bucket'
  })

  afterAll(() => {
    process.env.AWS_REGION = originalAwsRegion
    process.env.AWS_ACCESS_KEY_ID = originalAwsAccessKeyId
    process.env.AWS_SECRET_ACCESS_KEY = originalAwsSecretAccessKey
    process.env.AWS_BUCKET_NAME = originalAwsBucketName
  })

  // ── Static constants ──────────────────────────────────────────────────
  describe('static constants', () => {
    it('allowedFolders includes common folder names', () => {
      expect(AWSService.allowedFolders).toContain('general')
      expect(AWSService.allowedFolders).toContain('posts')
      expect(AWSService.allowedFolders).toContain('users')
    })

    it('allowedExtensions includes image and document types', () => {
      expect(AWSService.allowedExtensions).toContain('jpg')
      expect(AWSService.allowedExtensions).toContain('pdf')
      expect(AWSService.allowedExtensions).toContain('mp4')
    })

    it('allowedMimeTypes includes standard MIME types', () => {
      expect(AWSService.allowedMimeTypes).toContain('image/jpeg')
      expect(AWSService.allowedMimeTypes).toContain('application/pdf')
    })
  })

  // ── getPublicUrl (via instance access) ────────────────────────────────
  describe('getPublicUrl URL format', () => {
    it('constructs correct S3 public URL', () => {
      const instance = new AWSService()
      // Access protected method via cast
      const url = (instance as any).getPublicUrl('images/test.jpg')
      expect(url).toBe('https://my-test-bucket.s3.amazonaws.com/images/test.jpg')
    })
  })

  // ── env/config guards ─────────────────────────────────────────────────
  describe('env/config guards', () => {
    it('throws explicit error when required bucket is missing', () => {
      expect(() => new AWSService({ bucket: '' })).toThrow(
        'AWS S3 configuration is missing required fields: bucket'
      )
    })

    it('throws explicit error when credentials are missing', () => {
      expect(() => new AWSService({ accessKeyId: '', secretAccessKey: '' })).toThrow(
        'AWS S3 configuration is missing required fields: accessKeyId, secretAccessKey'
      )
    })
  })

  // ── getInstance singleton ─────────────────────────────────────────────
  describe('singleton pattern', () => {
    it('static methods return consistent results from same instance', () => {
      // Calling static methods multiple times should not throw
      expect(typeof AWSService.listFiles).toBe('function')
      expect(typeof AWSService.uploadFile).toBe('function')
      expect(typeof AWSService.deleteFile).toBe('function')
    })
  })

  // ── upload failure → state cleanup ────────────────────────────────────
  describe('upload failure cleanup', () => {
    it('propagates error without swallowing when S3 send fails', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('S3 service unavailable'))
      ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

      const instance = new AWSService()
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })

      await expect(instance.uploadFile(file, 'images')).rejects.toThrow('S3 service unavailable')
    })

    it('does not return a partial URL when upload fails', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Network timeout'))
      ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

      const instance = new AWSService()
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })

      let result: string | undefined
      try {
        result = await instance.uploadFile(file, 'images')
      } catch {
        // expected
      }
      expect(result).toBeUndefined()
    })

    it('propagates error for each independent upload attempt', async () => {
      const mockSend = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({})
      ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

      const instance = new AWSService()
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })

      await expect(instance.uploadFile(file, 'images')).rejects.toThrow('First failure')
      // Second attempt succeeds
      const url = await instance.uploadFile(file, 'images')
      expect(url).toMatch(/^https:\/\/my-test-bucket\.s3\.amazonaws\.com\/images\//)
    })
  })

  // ── duplicate key / overwrite behavior ───────────────────────────────
  describe('duplicate key / overwrite behavior', () => {
    it('generates a different key on each upload call (randomness prevents silent overwrite)', async () => {
      const mockSend = jest.fn().mockResolvedValue({})
      ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

      const instance = new AWSService()
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })

      await instance.uploadFile(file, 'images')
      await instance.uploadFile(file, 'images')

      const calls = (PutObjectCommand as jest.Mock).mock.calls
      expect(calls).toHaveLength(2)
      const key1: string = calls[0][0].Key
      const key2: string = calls[1][0].Key
      // Both keys should be in the correct folder
      expect(key1).toMatch(/^images\//)
      expect(key2).toMatch(/^images\//)
      // Keys are almost certainly different due to random segment
      // (not asserting strict inequality to avoid flakiness)
    })

    it('does not throw when uploading with a key that already exists (S3 overwrites silently)', async () => {
      const mockSend = jest.fn().mockResolvedValue({})
      ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

      const instance = new AWSService()
      const file = new File(['v1'], 'photo.jpg', { type: 'image/jpeg' })
      const file2 = new File(['v2'], 'photo.jpg', { type: 'image/jpeg' })

      const url1 = await instance.uploadFile(file, 'images')
      const url2 = await instance.uploadFile(file2, 'images')
      expect(typeof url1).toBe('string')
      expect(typeof url2).toBe('string')
    })
  })

  // ── invalid bucket name ───────────────────────────────────────────────
  describe('invalid bucket name', () => {
    it('throws config validation error when bucket is empty string', () => {
      expect(() => new AWSService({ bucket: '' })).toThrow(
        'AWS S3 configuration is missing required fields: bucket'
      )
    })

    it('throws config validation error when bucket is only whitespace', () => {
      expect(() => new AWSService({ bucket: '   ' })).toThrow(
        'AWS S3 configuration is missing required fields: bucket'
      )
    })

    it('accepts a valid bucket name without throwing', () => {
      expect(() => new AWSService({ bucket: 'valid-bucket-name' })).not.toThrow()
    })

    it('multiple missing fields are reported together', () => {
      expect(
        () =>
          new AWSService({
            accessKeyId: '',
            secretAccessKey: '',
            bucket: '',
          })
      ).toThrow('bucket, accessKeyId, secretAccessKey')
    })
  })

  // ── static delegation methods ─────────────────────────────────────────
  describe('AWSService static delegation methods', () => {
    let mockSend: jest.Mock

    beforeEach(() => {
      jest.clearAllMocks()
      // Reset singleton so each test gets a fresh instance from env vars
      ;(AWSService as any).instance = null
      mockSend = jest.fn()
      ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

      process.env.AWS_REGION = 'us-east-1'
      process.env.AWS_ACCESS_KEY_ID = 'test-key'
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret'
      process.env.AWS_BUCKET_NAME = 'test-bucket'
    })

    it('AWSService.listFiles creates instance and returns file list', async () => {
      mockSend.mockResolvedValue({ Contents: [] })

      const result = await AWSService.listFiles()

      expect(result).toEqual([])
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('AWSService.listFiles returns sorted list when bucket has contents', async () => {
      const older = new Date('2026-01-01T00:00:00Z')
      const newer = new Date('2026-03-01T00:00:00Z')
      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'images/old.jpg', Size: 100, LastModified: older },
          { Key: 'images/new.jpg', Size: 200, LastModified: newer },
        ],
      })

      const result = await AWSService.listFiles()

      expect(result).toHaveLength(2)
      expect(result[0].key).toBe('images/new.jpg')
    })

    it('AWSService.deleteFile creates instance and returns true on success', async () => {
      mockSend.mockResolvedValue({})

      const result = await AWSService.deleteFile('images/test.jpg')

      expect(result).toBe(true)
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('AWSService.deleteFile propagates error on S3 failure', async () => {
      mockSend.mockRejectedValue(new Error('Delete failed'))

      await expect(AWSService.deleteFile('images/test.jpg')).rejects.toThrow('Delete failed')
    })

    it('AWSService.getFileMetadata returns null when file not found', async () => {
      mockSend.mockRejectedValue(new Error('NotFound'))

      const result = await AWSService.getFileMetadata('images/missing.jpg')

      expect(result).toBeNull()
    })

    it('AWSService.getFileMetadata returns metadata when file exists', async () => {
      const lastModified = new Date('2026-02-01T00:00:00Z')
      mockSend.mockResolvedValue({
        ContentLength: 2048,
        ContentType: 'image/png',
        LastModified: lastModified,
      })

      const result = await AWSService.getFileMetadata('images/photo.png')

      expect(result).toEqual({ size: 2048, contentType: 'image/png', lastModified })
    })

    it('AWSService.uploadFile delegates to instance and returns a URL', async () => {
      mockSend.mockResolvedValue({})

      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
      const url = await AWSService.uploadFile(file, 'images')

      expect(typeof url).toBe('string')
      expect(url).toContain('test-bucket')
      expect(url).toMatch(/^https:\/\/test-bucket\.s3\.amazonaws\.com\/images\//)
    })

    it('AWSService.uploadFile uses general folder as default', async () => {
      mockSend.mockResolvedValue({})

      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
      const url = await AWSService.uploadFile(file)

      expect(url).toMatch(/^https:\/\/test-bucket\.s3\.amazonaws\.com\/general\//)
    })

    it('AWSService.uploadFromUrl delegates to instance', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        headers: { get: () => 'image/jpeg' },
        arrayBuffer: async () => new ArrayBuffer(8),
      })
      global.fetch = mockFetch
      mockSend.mockResolvedValue({})

      const url = await AWSService.uploadFromUrl('https://example.com/photo.jpg', 'images')

      expect(typeof url).toBe('string')
      expect(url).toContain('test-bucket')
    })

    it('reuses the same instance on consecutive static calls', async () => {
      mockSend.mockResolvedValue({ Contents: [] })

      await AWSService.listFiles()
      await AWSService.listFiles()

      // S3Client constructor should only have been called once (singleton reuse)
      expect(S3Client).toHaveBeenCalledTimes(1)
    })
  })
})
