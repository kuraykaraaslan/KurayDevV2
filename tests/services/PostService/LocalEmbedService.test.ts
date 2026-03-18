// @xenova/transformers must be mocked before importing the service
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() },
}))

import { pipeline } from '@xenova/transformers'
import LocalEmbedService from '@/services/PostService/LocalEmbedService'

const pipelineMock = pipeline as jest.MockedFunction<typeof pipeline>

// Reset the module-level embedder singleton between tests
beforeEach(() => {
  jest.clearAllMocks()
  // Reset internal singleton by re-requiring the module
  jest.resetModules()
})

describe('LocalEmbedService', () => {
  describe('getEmbedder', () => {
    it('calls pipeline once on first access (lazy init)', async () => {
      const mockModel = jest.fn().mockResolvedValue({ data: [0.1, 0.2, 0.3] })
      pipelineMock.mockResolvedValueOnce(mockModel as any)

      // Re-import to get fresh module with reset singleton
      const { default: Service } = await import('@/services/PostService/LocalEmbedService')
      await Service.getEmbedder()
      expect(pipelineMock).toHaveBeenCalledTimes(1)
      expect(pipelineMock).toHaveBeenCalledWith('feature-extraction', 'nomic-ai/nomic-embed-text-v1')
    })

    it('returns the same instance on second call (singleton)', async () => {
      const mockModel = jest.fn().mockResolvedValue({ data: [0.1, 0.2] })
      pipelineMock.mockResolvedValueOnce(mockModel as any)

      const { default: Service } = await import('@/services/PostService/LocalEmbedService')
      const first = await Service.getEmbedder()
      const second = await Service.getEmbedder()
      expect(pipelineMock).toHaveBeenCalledTimes(1)
      expect(first).toBe(second)
    })
  })

  describe('embed', () => {
    it('returns an array of embeddings for each input text', async () => {
      const mockModel = jest
        .fn()
        .mockResolvedValueOnce({ data: [0.1, 0.2, 0.3] })
        .mockResolvedValueOnce({ data: [0.4, 0.5, 0.6] })
      pipelineMock.mockResolvedValueOnce(mockModel as any)

      const { default: Service } = await import('@/services/PostService/LocalEmbedService')
      const result = await Service.embed(['hello world', 'foo bar'])
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual([0.1, 0.2, 0.3])
      expect(result[1]).toEqual([0.4, 0.5, 0.6])
    })

    it('returns empty array for empty input', async () => {
      const mockModel = jest.fn()
      pipelineMock.mockResolvedValueOnce(mockModel as any)

      const { default: Service } = await import('@/services/PostService/LocalEmbedService')
      const result = await Service.embed([])
      expect(result).toEqual([])
      expect(mockModel).not.toHaveBeenCalled()
    })
  })
})
