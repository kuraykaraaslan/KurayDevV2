import { pipeline } from '@xenova/transformers'

// Tek seferlik model yükle
let embedder: any | null = null

export default class LocalEmbedService {
  static async getEmbedder() {
    if (!embedder) {
      console.log('[LocalEmbedService] Loading nomic-embed-text-v1 model...')
      embedder = await pipeline('feature-extraction', 'nomic-ai/nomic-embed-text-v1')
    }
    return embedder
  }

  static async embed(texts: string[]): Promise<number[][]> {
    const model = await this.getEmbedder()
    const results = []
    for (const text of texts) {
      const out = await model(text, { pooling: 'mean', normalize: true })
      results.push(Array.from(out.data))
    }
    return results as number[][]
  }
}
