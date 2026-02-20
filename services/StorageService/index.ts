// Base Provider
import { BaseStorageProvider, StorageConfig, FileMetadata } from './BaseStorageProvider'

// Storage Providers
import { AWSService } from './AWSService'
import { CloudflareR2Service } from './CloudflareR2Service'
import { MinioService } from './MinioService'

// Re-export everything
export { BaseStorageProvider, type StorageConfig, type FileMetadata }
export { AWSService }
export { CloudflareR2Service }
export { MinioService }

// Provider Types
export type StorageProviderType = 'aws' | 'r2' | 'minio'

/**
 * Get the configured storage provider type from environment
 * Defaults to 'aws' if not specified
 */
export function getConfiguredProviderType(): StorageProviderType {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase() as StorageProviderType
  if (provider && ['aws', 'r2', 'minio'].includes(provider)) {
    return provider
  }
  return 'aws'
}

/**
 * Factory function to get storage provider instance
 * @param type - Provider type (aws, r2, minio). Defaults to STORAGE_PROVIDER env var
 * @param config - Optional configuration override
 */
export function getStorageProvider(type?: StorageProviderType, config?: Partial<StorageConfig>) {
  const providerType = type || getConfiguredProviderType()
  
  switch (providerType) {
    case 'aws':
      return new AWSService(config)
    case 'r2':
      return new CloudflareR2Service(config)
    case 'minio':
      return new MinioService(config)
    default:
      throw new Error(`Unknown storage provider type: ${providerType}`)
  }
}

/**
 * Get the default storage service based on STORAGE_PROVIDER env var
 * Cached singleton instance
 */
let defaultStorageInstance: BaseStorageProvider | null = null

export function getDefaultStorage(): BaseStorageProvider {
  if (!defaultStorageInstance) {
    defaultStorageInstance = getStorageProvider()
  }
  return defaultStorageInstance
}

// Default export - AWS for backwards compatibility
export default AWSService
