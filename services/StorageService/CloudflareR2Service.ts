import { BaseStorageProvider, StorageConfig } from './BaseStorageProvider'
import { S3Object } from '@/types/features/StorageTypes'

/**
 * Cloudflare R2 Storage Service
 * Extends BaseStorageProvider for R2-compatible storage operations
 *
 * R2 is S3-compatible and uses the same API but with different endpoints.
 * Endpoint format: https://<account_id>.r2.cloudflarestorage.com
 *
 * Environment variables:
 * - R2_ACCOUNT_ID: Cloudflare account ID
 * - R2_ACCESS_KEY_ID: R2 access key ID
 * - R2_SECRET_ACCESS_KEY: R2 secret access key
 * - R2_BUCKET_NAME: R2 bucket name
 * - R2_PUBLIC_URL: Optional custom domain for public access (e.g., https://cdn.example.com)
 */
export class CloudflareR2Service extends BaseStorageProvider {
  private publicUrl?: string

  constructor(config?: Partial<StorageConfig>) {
    const accountId = process.env.R2_ACCOUNT_ID || ''
    const defaultConfig: StorageConfig = {
      region: 'auto', // R2 doesn't use traditional regions
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucket: process.env.R2_BUCKET_NAME || '',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      ...config,
    }
    super(defaultConfig, 'Cloudflare R2')
    this.publicUrl = config?.publicUrl || process.env.R2_PUBLIC_URL
  }

  protected getPublicUrl(key: string): string {
    // If custom public URL is provided (e.g., via Cloudflare Workers or custom domain)
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`
    }
    // R2 doesn't have a default public URL, you need to set up public access
    // via Cloudflare Workers or R2 public bucket settings
    return `https://${this.config.bucket}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
  }

  // ============================================
  // Static methods for convenience
  // ============================================

  private static instance: CloudflareR2Service | null = null

  private static getInstance(): CloudflareR2Service {
    if (!CloudflareR2Service.instance) {
      CloudflareR2Service.instance = new CloudflareR2Service()
    }
    return CloudflareR2Service.instance
  }

  static allowedFolders = BaseStorageProvider.allowedFolders
  static allowedExtensions = BaseStorageProvider.allowedExtensions
  static allowedMimeTypes = BaseStorageProvider.allowedMimeTypes

  /**
   * List all files in R2 bucket with optional folder filter
   */
  static listFiles = async (folder?: string): Promise<S3Object[]> => {
    return CloudflareR2Service.getInstance().listFiles(folder)
  }

  /**
   * Delete a file from R2 bucket
   */
  static deleteFile = async (key: string): Promise<boolean> => {
    return CloudflareR2Service.getInstance().deleteFile(key)
  }

  /**
   * Get file metadata
   */
  static getFileMetadata = async (
    key: string
  ): Promise<{ size: number; contentType: string; lastModified: Date } | null> => {
    return CloudflareR2Service.getInstance().getFileMetadata(key)
  }

  /**
   * Upload a file to R2
   */
  static uploadFile = async (file: File, folder: string = 'general'): Promise<string | undefined> => {
    return CloudflareR2Service.getInstance().uploadFile(file, folder)
  }

  /**
   * Upload file from URL to R2
   */
  static uploadFromUrl = async (url: string, folder: string = 'general'): Promise<string | undefined> => {
    return CloudflareR2Service.getInstance().uploadFromUrl(url, folder)
  }
}

export default CloudflareR2Service
