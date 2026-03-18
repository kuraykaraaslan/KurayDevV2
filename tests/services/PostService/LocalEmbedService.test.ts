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
      jest.fn().mockResolvedValue({ data: [0.1, 0.2, 0.3] })
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
    it('returns a number[][] from Array.from(out.data)', async () => {
      const result = await LocalEmbedService.embed(['hello world'])

      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([[0.1, 0.2, 0.3]])
    })

    it('calls the embedder for each text individually with correct options', async () => {
      const mockModel = jest.fn().mockResolvedValue({ data: [0.4, 0.5] })
      pipelineMock.mockResolvedValue(mockModel)

      await LocalEmbedService.embed(['text1', 'text2'])

      expect(mockModel).toHaveBeenCalledTimes(2)
      expect(mockModel).toHaveBeenCalledWith('text1', { pooling: 'mean', normalize: true })
      expect(mockModel).toHaveBeenCalledWith('text2', { pooling: 'mean', normalize: true })
    })

    it('returns correct results for multiple input texts', async () => {
      const mockModel = jest.fn()
        .mockResolvedValueOnce({ data: [0.1, 0.2] })
        .mockResolvedValueOnce({ data: [0.3, 0.4] })
      pipelineMock.mockResolvedValue(mockModel)

      const result = await LocalEmbedService.embed(['first', 'second'])

      expect(result).toEqual([[0.1, 0.2], [0.3, 0.4]])
    })

    it('handles an empty input array', async () => {
      const result = await LocalEmbedService.embed([])

      expect(result).toEqual([])
    })
  })
})
