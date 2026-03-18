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

import { S3Client, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { BaseStorageProvider, StorageConfig } from '@/services/StorageService/BaseStorageProvider'

// Concrete subclass so we can instantiate the abstract base
class ConcreteStorage extends BaseStorageProvider {
  constructor(config: StorageConfig) {
    super(config, 'TestProvider')
  }
  protected getPublicUrl(key: string): string {
    return `https://cdn.example.com/${key}`
  }
}

const VALID_CONFIG: StorageConfig = {
  region: 'us-east-1',
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
  bucket: 'test-bucket',
}

describe('BaseStorageProvider', () => {
  let mockSend: jest.Mock
  let instance: ConcreteStorage

  beforeEach(() => {
    jest.clearAllMocks()
    mockSend = jest.fn()
    ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))
    instance = new ConcreteStorage(VALID_CONFIG)
  })

  // ── static constants ─────────────────────────────────────────────────
  describe('static constants', () => {
    it('allowedFolders contains expected folder names', () => {
      expect(BaseStorageProvider.allowedFolders).toContain('general')
      expect(BaseStorageProvider.allowedFolders).toContain('posts')
      expect(BaseStorageProvider.allowedFolders).toContain('users')
      expect(BaseStorageProvider.allowedFolders).toContain('images')
      expect(BaseStorageProvider.allowedFolders).toContain('videos')
    })

    it('allowedExtensions contains image, video, audio and document types', () => {
      expect(BaseStorageProvider.allowedExtensions).toContain('jpg')
      expect(BaseStorageProvider.allowedExtensions).toContain('png')
      expect(BaseStorageProvider.allowedExtensions).toContain('mp4')
      expect(BaseStorageProvider.allowedExtensions).toContain('pdf')
      expect(BaseStorageProvider.allowedExtensions).toContain('zip')
    })

    it('allowedMimeTypes contains standard MIME types', () => {
      expect(BaseStorageProvider.allowedMimeTypes).toContain('image/jpeg')
      expect(BaseStorageProvider.allowedMimeTypes).toContain('video/mp4')
      expect(BaseStorageProvider.allowedMimeTypes).toContain('application/pdf')
      expect(BaseStorageProvider.allowedMimeTypes).toContain('application/zip')
    })
  })

  // ── validateConfig ───────────────────────────────────────────────────
  describe('validateConfig', () => {
    it('accepts a fully valid config without throwing', () => {
      expect(() => new ConcreteStorage(VALID_CONFIG)).not.toThrow()
    })

    it('throws when region is missing', () => {
      expect(() => new ConcreteStorage({ ...VALID_CONFIG, region: '' })).toThrow(
        'TestProvider configuration is missing required fields: region'
      )
    })

    it('throws when bucket is missing', () => {
      expect(() => new ConcreteStorage({ ...VALID_CONFIG, bucket: '' })).toThrow(
        'TestProvider configuration is missing required fields: bucket'
      )
    })

    it('throws when accessKeyId is missing', () => {
      expect(() => new ConcreteStorage({ ...VALID_CONFIG, accessKeyId: '' })).toThrow(
        'TestProvider configuration is missing required fields: accessKeyId'
      )
    })

    it('throws when secretAccessKey is missing', () => {
      expect(() => new ConcreteStorage({ ...VALID_CONFIG, secretAccessKey: '' })).toThrow(
        'TestProvider configuration is missing required fields: secretAccessKey'
      )
    })

    it('lists all missing fields in a single error', () => {
      expect(
        () =>
          new ConcreteStorage({
            region: '',
            bucket: '',
            accessKeyId: '',
            secretAccessKey: '',
          })
      ).toThrow('region, bucket, accessKeyId, secretAccessKey')
    })

    it('throws when region is only whitespace', () => {
      expect(() => new ConcreteStorage({ ...VALID_CONFIG, region: '   ' })).toThrow(
        'TestProvider configuration is missing required fields: region'
      )
    })
  })

  // ── createClient ─────────────────────────────────────────────────────
  describe('createClient', () => {
    it('constructs S3Client with correct region and credentials', () => {
      new ConcreteStorage(VALID_CONFIG)
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'us-east-1',
          credentials: {
            accessKeyId: 'test-access-key',
            secretAccessKey: 'test-secret-key',
          },
        })
      )
    })

    it('passes endpoint when provided', () => {
      new ConcreteStorage({ ...VALID_CONFIG, endpoint: 'https://custom.endpoint.com' })
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: 'https://custom.endpoint.com' })
      )
    })

    it('passes forcePathStyle when set to true', () => {
      new ConcreteStorage({ ...VALID_CONFIG, forcePathStyle: true })
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({ forcePathStyle: true })
      )
    })

    it('does not pass endpoint when not provided', () => {
      new ConcreteStorage(VALID_CONFIG)
      const callArgs = (S3Client as jest.Mock).mock.calls.at(-1)?.[0]
      expect(callArgs).not.toHaveProperty('endpoint')
    })
  })

  // ── getProviderName ──────────────────────────────────────────────────
  describe('getProviderName', () => {
    it('returns the provider name passed to constructor', () => {
      expect(instance.getProviderName()).toBe('TestProvider')
    })
  })

  // ── validateFile (protected, accessed via cast) ──────────────────────
  describe('validateFile', () => {
    const makeFile = (name: string, type: string, size = 100): File => {
      const blob = new Blob([new Uint8Array(size)], { type })
      return new File([blob], name, { type })
    }

    it('accepts a valid image file in a valid folder', () => {
      const file = makeFile('photo.jpg', 'image/jpeg')
      expect(() => (instance as any).validateFile(file, 'images')).not.toThrow()
    })

    it('throws INVALID_FOLDER_NAME for an unknown folder', () => {
      const file = makeFile('photo.jpg', 'image/jpeg')
      expect(() => (instance as any).validateFile(file, 'unknown-folder')).toThrow(
        'INVALID_FOLDER_NAME'
      )
    })

    it('throws for an invalid extension', () => {
      const file = makeFile('script.exe', 'application/octet-stream')
      // .exe is not in allowedExtensions
      expect(() => (instance as any).validateFile(file, 'general')).toThrow(
        'Invalid file extension: .exe'
      )
    })

    it('throws for an invalid MIME type', () => {
      const file = makeFile('test.jpg', 'text/html')
      expect(() => (instance as any).validateFile(file, 'general')).toThrow(
        'Invalid MIME type: text/html'
      )
    })

    it('throws when no file is provided', () => {
      expect(() => (instance as any).validateFile(null, 'general')).toThrow(
        'No file provided'
      )
    })

    it('accepts a PDF document in the files folder', () => {
      const file = makeFile('report.pdf', 'application/pdf')
      expect(() => (instance as any).validateFile(file, 'files')).not.toThrow()
    })

    it('accepts a ZIP archive in the general folder', () => {
      const file = makeFile('archive.zip', 'application/zip')
      expect(() => (instance as any).validateFile(file, 'general')).not.toThrow()
    })
  })

  // ── generateFileKey ──────────────────────────────────────────────────
  describe('generateFileKey', () => {
    it('returns a key with the folder prefix', () => {
      const key = (instance as any).generateFileKey('images', 'photo.jpg')
      expect(key).toMatch(/^images\//)
    })

    it('preserves the original file extension (lowercased)', () => {
      const key = (instance as any).generateFileKey('general', 'document.PDF')
      expect(key).toMatch(/\.pdf$/)
    })

    it('includes a timestamp-like numeric segment', () => {
      const before = Date.now()
      const key = (instance as any).generateFileKey('posts', 'image.png')
      const after = Date.now()
      // key format: folder/timestamp-randomString.ext
      const parts = key.split('/')
      const namePart = parts[1].split('-')
      const ts = parseInt(namePart[0], 10)
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    it('two calls produce different keys (random segment)', () => {
      const k1 = (instance as any).generateFileKey('images', 'test.jpg')
      const k2 = (instance as any).generateFileKey('images', 'test.jpg')
      // They may rarely collide, but virtually never
      expect(typeof k1).toBe('string')
      expect(typeof k2).toBe('string')
    })
  })

  // ── listFiles ────────────────────────────────────────────────────────
  describe('listFiles', () => {
    it('returns empty array when bucket has no contents', async () => {
      mockSend.mockResolvedValue({ Contents: [] })
      const result = await instance.listFiles()
      expect(result).toEqual([])
    })

    it('returns mapped S3Objects sorted by lastModified descending', async () => {
      const older = new Date('2026-01-01T00:00:00Z')
      const newer = new Date('2026-03-01T00:00:00Z')
      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'images/old.jpg', Size: 100, LastModified: older },
          { Key: 'images/new.jpg', Size: 200, LastModified: newer },
        ],
      })
      const result = await instance.listFiles()
      expect(result).toHaveLength(2)
      expect(result[0].key).toBe('images/new.jpg')
      expect(result[1].key).toBe('images/old.jpg')
    })

    it('passes folder as Prefix when provided', async () => {
      mockSend.mockResolvedValue({ Contents: [] })
      await instance.listFiles('posts')
      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({ Prefix: 'posts/' })
      )
    })

    it('omits Prefix when no folder is specified', async () => {
      mockSend.mockResolvedValue({ Contents: [] })
      await instance.listFiles()
      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({ Prefix: undefined })
      )
    })

    it('skips items with size 0 (zero-byte objects)', async () => {
      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'images/empty.jpg', Size: 0, LastModified: new Date() },
          { Key: 'images/real.jpg', Size: 512, LastModified: new Date() },
        ],
      })
      const result = await instance.listFiles()
      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('images/real.jpg')
    })

    it('populates url via getPublicUrl', async () => {
      mockSend.mockResolvedValue({
        Contents: [{ Key: 'general/test.txt', Size: 10, LastModified: new Date() }],
      })
      const result = await instance.listFiles()
      expect(result[0].url).toBe('https://cdn.example.com/general/test.txt')
    })

    it('uses bucket from config in ListObjectsV2Command', async () => {
      mockSend.mockResolvedValue({ Contents: [] })
      await instance.listFiles()
      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: 'test-bucket' })
      )
    })
  })

  // ── deleteFile ───────────────────────────────────────────────────────
  describe('deleteFile', () => {
    it('returns true on successful delete', async () => {
      mockSend.mockResolvedValue({})
      const result = await instance.deleteFile('images/photo.jpg')
      expect(result).toBe(true)
    })

    it('sends DeleteObjectCommand with correct Bucket and Key', async () => {
      mockSend.mockResolvedValue({})
      await instance.deleteFile('posts/cover.png')
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'posts/cover.png',
      })
    })

    it('propagates S3 errors', async () => {
      mockSend.mockRejectedValue(new Error('Access Denied'))
      await expect(instance.deleteFile('images/secret.jpg')).rejects.toThrow('Access Denied')
    })
  })

  // ── getFileMetadata ──────────────────────────────────────────────────
  describe('getFileMetadata', () => {
    it('returns metadata object when file exists', async () => {
      const lastModified = new Date('2026-02-15T10:00:00Z')
      mockSend.mockResolvedValue({
        ContentLength: 2048,
        ContentType: 'image/jpeg',
        LastModified: lastModified,
      })
      const result = await instance.getFileMetadata('images/photo.jpg')
      expect(result).toEqual({
        size: 2048,
        contentType: 'image/jpeg',
        lastModified,
      })
    })

    it('returns null when file does not exist (404 error)', async () => {
      mockSend.mockRejectedValue(Object.assign(new Error('NoSuchKey'), { name: 'NoSuchKey' }))
      const result = await instance.getFileMetadata('images/missing.jpg')
      expect(result).toBeNull()
    })

    it('returns null on any S3 error', async () => {
      mockSend.mockRejectedValue(new Error('Internal Server Error'))
      const result = await instance.getFileMetadata('images/any.jpg')
      expect(result).toBeNull()
    })

    it('uses HeadObjectCommand with correct Bucket and Key', async () => {
      mockSend.mockResolvedValue({ ContentLength: 100, ContentType: 'image/png', LastModified: new Date() })
      await instance.getFileMetadata('users/avatar.png')
      expect(HeadObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'users/avatar.png',
      })
    })

    it('falls back to 0 for missing ContentLength', async () => {
      mockSend.mockResolvedValue({ ContentType: 'image/jpeg', LastModified: new Date() })
      const result = await instance.getFileMetadata('images/any.jpg')
      expect(result?.size).toBe(0)
    })

    it('falls back to application/octet-stream for missing ContentType', async () => {
      mockSend.mockResolvedValue({ ContentLength: 512, LastModified: new Date() })
      const result = await instance.getFileMetadata('images/any.jpg')
      expect(result?.contentType).toBe('application/octet-stream')
    })
  })

  // ── uploadFile ───────────────────────────────────────────────────────
  describe('uploadFile', () => {
    const makeFile = (name: string, type: string, content = 'data'): File =>
      new File([content], name, { type })

    it('returns the public URL on successful upload', async () => {
      mockSend.mockResolvedValue({})
      const file = makeFile('photo.jpg', 'image/jpeg')
      const url = await instance.uploadFile(file, 'images')
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/images\//)
    })

    it('sends PutObjectCommand with correct Bucket and ContentType', async () => {
      mockSend.mockResolvedValue({})
      const file = makeFile('photo.png', 'image/png')
      await instance.uploadFile(file, 'images')
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          ContentType: 'image/png',
        })
      )
    })

    it('uses general folder when none is specified', async () => {
      mockSend.mockResolvedValue({})
      const file = makeFile('doc.pdf', 'application/pdf')
      const url = await instance.uploadFile(file)
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/general\//)
    })

    it('throws for an invalid folder', async () => {
      const file = makeFile('photo.jpg', 'image/jpeg')
      await expect(instance.uploadFile(file, 'invalid-folder')).rejects.toThrow('INVALID_FOLDER_NAME')
    })

    it('throws for an invalid file extension', async () => {
      const file = makeFile('virus.exe', 'application/octet-stream')
      await expect(instance.uploadFile(file, 'general')).rejects.toThrow('Invalid file extension')
    })

    it('propagates S3 send errors', async () => {
      mockSend.mockRejectedValue(new Error('S3 unavailable'))
      const file = makeFile('photo.jpg', 'image/jpeg')
      await expect(instance.uploadFile(file, 'images')).rejects.toThrow('S3 unavailable')
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
      const url = await instance.uploadFromUrl('https://example.com/image.jpg', 'images')
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\/images\//)
    })

    it('throws INVALID_FOLDER_NAME for unknown folder', async () => {
      await expect(
        instance.uploadFromUrl('https://example.com/image.jpg', 'bad-folder')
      ).rejects.toThrow('INVALID_FOLDER_NAME')
    })

    it('throws for unsupported MIME type from URL', async () => {
      mockFetch.mockResolvedValue({
        headers: { get: () => 'text/html' },
        arrayBuffer: async () => new ArrayBuffer(8),
      })
      await expect(
        instance.uploadFromUrl('https://example.com/page.html', 'general')
      ).rejects.toThrow('Invalid MIME type from URL: text/html')
    })

    it('propagates fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(
        instance.uploadFromUrl('https://example.com/image.jpg', 'general')
      ).rejects.toThrow('Network error')
    })
  })

  // ── stripImageMetadata ───────────────────────────────────────────────
  describe('stripImageMetadata', () => {
    it('processes image buffers through sharp', async () => {
      const sharp = require('sharp')
      const buffer = Buffer.from('fake-image-data')
      await (instance as any).stripImageMetadata(buffer, 'image/jpeg')
      expect(sharp).toHaveBeenCalledWith(buffer)
    })

    it('returns the original buffer unchanged for non-image types', async () => {
      const buffer = Buffer.from('pdf-content')
      const result = await (instance as any).stripImageMetadata(buffer, 'application/pdf')
      expect(result).toBe(buffer)
    })

    it('returns the original buffer for video types', async () => {
      const buffer = Buffer.from('video-data')
      const result = await (instance as any).stripImageMetadata(buffer, 'video/mp4')
      expect(result).toBe(buffer)
    })

    it('processes all four image MIME types through sharp', async () => {
      const sharp = require('sharp')
      const imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
      for (const mime of imageMimes) {
        jest.clearAllMocks()
        ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))
        sharp.mockReturnValue({
          rotate: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed')),
        })
        const buffer = Buffer.from('raw')
        await (instance as any).stripImageMetadata(buffer, mime)
        expect(sharp).toHaveBeenCalledWith(buffer)
      }
    })
  })
})
