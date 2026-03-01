export type ShortLink = {
  id: string
  code: string
  originalUrl: string
  clicks: number
  createdAt: string | Date
  [key: string]: unknown
}
