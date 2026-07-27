import Logger from '@/libs/logger'
import { pipeline } from '@xenova/transformers'

let embedder: any | null = null

export default class LocalEmbedService {
  static async getEmbedder() {
    if (!embedder) {
      Logger.info('[Embed] Loading local embedding model...')
      embedder = await pipeline('feature-extraction', 'nomic-ai/nomic-embed-text-v1')
    }
    return embedder
  }

  /**
   * Embed one or many texts. Uses the pipeline's batched (array) API so a batch
   * of N runs as a single forward pass instead of N sequential ones — this is the
   * hot path for KG rebuilds and dataset pre-computation. Mean pooling uses the
   * attention mask, so per-text vectors are independent of batch padding and stay
   * identical to the single-text result (cosine scores are comparable across calls).
   * Chunked to bound peak memory on large corpora.
   */
  static async embed(texts: string[], batchSize = 32): Promise<number[][]> {
    if (texts.length === 0) return []
    const model = await this.getEmbedder()
    const results: number[][] = []
    for (let i = 0; i < texts.length; i += batchSize) {
      const chunk = texts.slice(i, i + batchSize)
      const out = await model(chunk, { pooling: 'mean', normalize: true })
      results.push(...(out.tolist() as number[][]))
    }
    return results
  }
}
