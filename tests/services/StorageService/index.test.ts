import { StorageService } from '@/services/StorageService'

describe('StorageService', () => {
  const originalStorageProvider = process.env.STORAGE_PROVIDER

  afterEach(() => {
    process.env.STORAGE_PROVIDER = originalStorageProvider
  })

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
  })
})
