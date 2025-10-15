export interface KnowledgeGraphNode {
  id: string
  title: string
  slug: string
  categorySlug: string
  image?: string 
  views: number
  embedding: number[]
  size?: number
}