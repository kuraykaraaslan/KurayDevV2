export interface KnowledgeGraphNode {
  id: string
  title: string
  slug: string
  categorySlug: string
  views: number
  embedding: number[]
  size?: number
}