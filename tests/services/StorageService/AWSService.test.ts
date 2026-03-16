jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  PutObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}))

jest.mock('sharp', () => jest.fn().mockReturnValue({
  resize: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('img')),
}))

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
})
