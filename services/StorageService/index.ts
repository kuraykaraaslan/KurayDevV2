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

export class StorageService {
  private static defaultInstance: BaseStorageProvider | null = null

  static getConfiguredProviderType(): StorageProviderType {
    const provider = process.env.STORAGE_PROVIDER?.toLowerCase() as StorageProviderType
    if (!provider) {
      return 'aws'
    }

    if (['aws', 'r2', 'minio'].includes(provider)) {
      return provider
    }

    throw new Error(`Unsupported STORAGE_PROVIDER value: ${provider}`)
  }

  static getProvider(type?: StorageProviderType, config?: Partial<StorageConfig>): BaseStorageProvider {
    const providerType = type || StorageService.getConfiguredProviderType()

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

  static getDefault(): BaseStorageProvider {
    if (!StorageService.defaultInstance) {
      StorageService.defaultInstance = StorageService.getProvider()
    }
    return StorageService.defaultInstance
  }
}
