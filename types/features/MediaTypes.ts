export interface MediaFile {
  key: string
  url: string
  size: number
  lastModified: string
  folder: string
  [key: string]: unknown
}
