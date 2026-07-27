jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
}))

describe('LocalEmbedService', () => {
  let pipelineMock: jest.Mock
  let LocalEmbedService: typeof import('@/services/PostService/LocalEmbedService').default

  beforeEach(async () => {
    jest.resetModules()
    const transformers = await import('@xenova/transformers')
    pipelineMock = transformers.pipeline as jest.Mock
    pipelineMock.mockResolvedValue(
      jest.fn().mockResolvedValue({ tolist: () => [[0.1, 0.2, 0.3]] })
    )
    LocalEmbedService = (await import('@/services/PostService/LocalEmbedService')).default
  })

  // ── getEmbedder ───────────────────────────────────────────────────────
  describe('getEmbedder', () => {
    it('calls pipeline with correct model arguments on first call', async () => {
      await LocalEmbedService.getEmbedder()

      expect(pipelineMock).toHaveBeenCalledTimes(1)
      expect(pipelineMock).toHaveBeenCalledWith(
        'feature-extraction',
        'nomic-ai/nomic-embed-text-v1'
      )
    })

    it('returns the pipeline instance', async () => {
      const embedder = await LocalEmbedService.getEmbedder()
      expect(embedder).toBeDefined()
      expect(typeof embedder).toBe('function')
    })

    it('caches the embedder and does not re-initialise on subsequent calls', async () => {
      await LocalEmbedService.getEmbedder()
      await LocalEmbedService.getEmbedder()

      expect(pipelineMock).toHaveBeenCalledTimes(1)
    })
  })

  // ── embed ─────────────────────────────────────────────────────────────
  describe('embed', () => {
    it('returns a number[][] from the batched tensor tolist() output', async () => {
      const result = await LocalEmbedService.embed(['hello world'])

      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([[0.1, 0.2, 0.3]])
    })

    it('embeds all texts in a single batched call with correct options', async () => {
      const mockModel = jest.fn().mockResolvedValue({ tolist: () => [[0.4, 0.5], [0.6, 0.7]] })
      pipelineMock.mockResolvedValue(mockModel)

      await LocalEmbedService.embed(['text1', 'text2'])

      // Batched: one forward pass for the whole chunk, not one per text.
      expect(mockModel).toHaveBeenCalledTimes(1)
      expect(mockModel).toHaveBeenCalledWith(['text1', 'text2'], { pooling: 'mean', normalize: true })
    })

    it('returns correct results for multiple input texts', async () => {
      const mockModel = jest.fn().mockResolvedValue({ tolist: () => [[0.1, 0.2], [0.3, 0.4]] })
      pipelineMock.mockResolvedValue(mockModel)

      const result = await LocalEmbedService.embed(['first', 'second'])

      expect(result).toEqual([[0.1, 0.2], [0.3, 0.4]])
    })

    it('splits large inputs into batched chunks (batchSize)', async () => {
      const mockModel = jest.fn()
        .mockResolvedValueOnce({ tolist: () => [[1], [2]] })
        .mockResolvedValueOnce({ tolist: () => [[3]] })
      pipelineMock.mockResolvedValue(mockModel)

      const result = await LocalEmbedService.embed(['a', 'b', 'c'], 2)

      expect(mockModel).toHaveBeenCalledTimes(2)
      expect(mockModel).toHaveBeenNthCalledWith(1, ['a', 'b'], { pooling: 'mean', normalize: true })
      expect(mockModel).toHaveBeenNthCalledWith(2, ['c'], { pooling: 'mean', normalize: true })
      expect(result).toEqual([[1], [2], [3]])
    })

    it('handles an empty input array', async () => {
      const result = await LocalEmbedService.embed([])

      expect(result).toEqual([])
    })
  })
})
