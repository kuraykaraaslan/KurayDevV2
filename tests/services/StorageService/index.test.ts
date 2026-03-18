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
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('img')),
  })
)

import { StorageService, AWSService, CloudflareR2Service, MinioService } from '@/services/StorageService'

const VALID_AWS_CONFIG = {
  region: 'us-east-1',
  accessKeyId: 'aws-key',
  secretAccessKey: 'aws-secret',
  bucket: 'aws-bucket',
}

const VALID_R2_CONFIG = {
  region: 'auto',
  accessKeyId: 'r2-key',
  secretAccessKey: 'r2-secret',
  bucket: 'r2-bucket',
  endpoint: 'https://account.r2.cloudflarestorage.com',
  forcePathStyle: true as const,
}

const VALID_MINIO_CONFIG = {
  region: 'us-east-1',
  accessKeyId: 'minio-key',
  secretAccessKey: 'minio-secret',
  bucket: 'minio-bucket',
  endpoint: 'http://localhost:9000',
  forcePathStyle: true as const,
}

describe('StorageService', () => {
  const originalEnv = {
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset singleton for each test
    ;(StorageService as any).defaultInstance = null

    // Set valid env for all providers so constructor doesn't throw
    process.env.AWS_REGION = 'us-east-1'
    process.env.AWS_ACCESS_KEY_ID = 'aws-key'
    process.env.AWS_SECRET_ACCESS_KEY = 'aws-secret'
    process.env.AWS_BUCKET_NAME = 'aws-bucket'
    process.env.R2_ACCOUNT_ID = 'test-account'
    process.env.R2_ACCESS_KEY_ID = 'r2-key'
    process.env.R2_SECRET_ACCESS_KEY = 'r2-secret'
    process.env.R2_BUCKET_NAME = 'r2-bucket'
    process.env.MINIO_ENDPOINT = 'http://localhost:9000'
    process.env.MINIO_ACCESS_KEY = 'minio-key'
    process.env.MINIO_SECRET_KEY = 'minio-secret'
    process.env.MINIO_BUCKET_NAME = 'minio-bucket'
  })

  afterEach(() => {
    process.env.STORAGE_PROVIDER = originalEnv.STORAGE_PROVIDER
    ;(StorageService as any).defaultInstance = null
  })

  afterAll(() => {
    Object.assign(process.env, originalEnv)
  })

  // ── getConfiguredProviderType ────────────────────────────────────────
  describe('getConfiguredProviderType', () => {
    it('defaults to aws when STORAGE_PROVIDER is not set', () => {
      delete process.env.STORAGE_PROVIDER
      expect(StorageService.getConfiguredProviderType()).toBe('aws')
    })

    it('returns configured provider when value is valid', () => {
      process.env.STORAGE_PROVIDER = 'MINIO'
      expect(StorageService.getConfiguredProviderType()).toBe('minio')
    })

    it('throws explicit error for unsupported provider instead of silent fallback', () => {
      process.env.STORAGE_PROVIDER = 'gcs'
      expect(() => StorageService.getConfiguredProviderType()).toThrow(
        'Unsupported STORAGE_PROVIDER value: gcs'
      )
    })

    it('returns r2 when STORAGE_PROVIDER is set to r2 (case-insensitive)', () => {
      process.env.STORAGE_PROVIDER = 'R2'
      expect(StorageService.getConfiguredProviderType()).toBe('r2')
    })

    it('returns aws when STORAGE_PROVIDER is set to aws', () => {
      process.env.STORAGE_PROVIDER = 'aws'
      expect(StorageService.getConfiguredProviderType()).toBe('aws')
    })
  })

  // ── getProvider — provider selection ────────────────────────────────
  describe('getProvider — provider selection based on config/env', () => {
    it('returns AWSService when type is aws', () => {
      const provider = StorageService.getProvider('aws', VALID_AWS_CONFIG)
      expect(provider).toBeInstanceOf(AWSService)
    })

    it('returns CloudflareR2Service when type is r2', () => {
      const provider = StorageService.getProvider('r2', VALID_R2_CONFIG)
      expect(provider).toBeInstanceOf(CloudflareR2Service)
    })

    it('returns MinioService when type is minio', () => {
      const provider = StorageService.getProvider('minio', VALID_MINIO_CONFIG)
      expect(provider).toBeInstanceOf(MinioService)
    })

    it('reads STORAGE_PROVIDER env to select provider when type is omitted', () => {
      process.env.STORAGE_PROVIDER = 'minio'
      const provider = StorageService.getProvider(undefined, VALID_MINIO_CONFIG)
      expect(provider).toBeInstanceOf(MinioService)
    })

    it('defaults to AWSService when STORAGE_PROVIDER is not set and no type given', () => {
      delete process.env.STORAGE_PROVIDER
      const provider = StorageService.getProvider(undefined, VALID_AWS_CONFIG)
      expect(provider).toBeInstanceOf(AWSService)
    })

    it('each call to getProvider returns a new instance (not cached)', () => {
      const p1 = StorageService.getProvider('aws', VALID_AWS_CONFIG)
      const p2 = StorageService.getProvider('aws', VALID_AWS_CONFIG)
      expect(p1).not.toBe(p2)
    })

    it('returned provider exposes getProviderName correctly for AWS', () => {
      const provider = StorageService.getProvider('aws', VALID_AWS_CONFIG)
      expect(provider.getProviderName()).toBe('AWS S3')
    })

    it('returned provider exposes getProviderName correctly for R2', () => {
      const provider = StorageService.getProvider('r2', VALID_R2_CONFIG)
      expect(provider.getProviderName()).toBe('Cloudflare R2')
    })

    it('returned provider exposes getProviderName correctly for MinIO', () => {
      const provider = StorageService.getProvider('minio', VALID_MINIO_CONFIG)
      expect(provider.getProviderName()).toBe('MinIO')
    })
  })

  // ── getProvider — invalid provider name ──────────────────────────────
  describe('getProvider — invalid provider name', () => {
    it('throws when STORAGE_PROVIDER env is set to an unsupported value', () => {
      process.env.STORAGE_PROVIDER = 'azureblob'
      expect(() => StorageService.getProvider()).toThrow(
        'Unsupported STORAGE_PROVIDER value: azureblob'
      )
    })

    it('throws Unsupported STORAGE_PROVIDER error on unknown string via env', () => {
      process.env.STORAGE_PROVIDER = 'gcs'
      expect(() => StorageService.getProvider()).toThrow('Unsupported STORAGE_PROVIDER value: gcs')
    })
  })

  // ── getDefault — singleton ────────────────────────────────────────────
  describe('getDefault', () => {
    it('returns a BaseStorageProvider instance', () => {
      delete process.env.STORAGE_PROVIDER
      const provider = StorageService.getDefault()
      expect(provider).toBeInstanceOf(AWSService)
    })

    it('returns the same instance on repeated calls (singleton)', () => {
      delete process.env.STORAGE_PROVIDER
      const p1 = StorageService.getDefault()
      const p2 = StorageService.getDefault()
      expect(p1).toBe(p2)
    })

    it('singleton is AWSService when STORAGE_PROVIDER=aws', () => {
      process.env.STORAGE_PROVIDER = 'aws'
      const provider = StorageService.getDefault()
      expect(provider).toBeInstanceOf(AWSService)
    })

    it('singleton is MinioService when STORAGE_PROVIDER=minio', () => {
      process.env.STORAGE_PROVIDER = 'minio'
      const provider = StorageService.getDefault()
      expect(provider).toBeInstanceOf(MinioService)
    })

    it('singleton is CloudflareR2Service when STORAGE_PROVIDER=r2', () => {
      process.env.STORAGE_PROVIDER = 'r2'
      const provider = StorageService.getDefault()
      expect(provider).toBeInstanceOf(CloudflareR2Service)
    })
  })

  // ── re-exports ────────────────────────────────────────────────────────
  describe('re-exports', () => {
    it('exports AWSService class', () => {
      expect(AWSService).toBeDefined()
      expect(typeof AWSService).toBe('function')
    })

    it('exports CloudflareR2Service class', () => {
      expect(CloudflareR2Service).toBeDefined()
      expect(typeof CloudflareR2Service).toBe('function')
    })

    it('exports MinioService class', () => {
      expect(MinioService).toBeDefined()
      expect(typeof MinioService).toBe('function')
    })
  })
})
