// Mock global fetch before any imports that might use it
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock redis used for model caching
jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

import redis from '@/libs/redis'
import { GeminiProvider } from '@/services/AIServices/GeminiProvider'

const redisMock = redis as jest.Mocked<typeof redis>

describe('GeminiProvider', () => {
  let provider: GeminiProvider
  const originalApiKey = process.env.GOOGLE_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_API_KEY = 'test-google-api-key'
    provider = new GeminiProvider()
    // Default: cache miss
    redisMock.get.mockResolvedValue(null)
    redisMock.set.mockResolvedValue('OK')
  })

  afterAll(() => {
    process.env.GOOGLE_API_KEY = originalApiKey
  })

  // ── getModels ────────────────────────────────────────────────────────
  describe('getModels', () => {
    it('returns models from Redis cache when available', async () => {
      const cached = [
        { id: 'GOOGLE_GENAI::gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'GOOGLE_GENAI', modelName: 'gemini-2.0-flash' },
      ]
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cached))

      const models = await provider.getModels()

      expect(models).toEqual(cached)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('fetches models from API on cache miss and stores in Redis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'models/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/text-embedding-004', displayName: 'Text Embedding 004', supportedGenerationMethods: ['embedContent'] },
          ],
        }),
      })

      const models = await provider.getModels()

      // Only models with generateContent should be returned
      expect(models).toHaveLength(2)
      expect(models[0].modelName).toBe('gemini-2.0-flash')
      expect(models[0].provider).toBe('GOOGLE_GENAI')
      expect(redisMock.set).toHaveBeenCalled()
    })

    it('strips "models/" prefix from model names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'models/gemini-2.0-flash', displayName: 'Flash', supportedGenerationMethods: ['generateContent'] },
          ],
        }),
      })

      const models = await provider.getModels()
      expect(models[0].modelName).toBe('gemini-2.0-flash')
    })

    it('throws when API returns non-OK status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 })

      await expect(provider.getModels()).rejects.toThrow('[GeminiProvider] Failed to fetch models: 403')
    })

    it('throws when GOOGLE_API_KEY is not set', async () => {
      delete process.env.GOOGLE_API_KEY

      await expect(provider.getModels()).rejects.toThrow('[GeminiProvider] GOOGLE_API_KEY is not set.')

      process.env.GOOGLE_API_KEY = 'test-google-api-key'
    })
  })

  // ── generateText ─────────────────────────────────────────────────────
  describe('generateText', () => {
    it('returns plain text from a successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: 'Hello from Gemini' }] } },
          ],
        }),
      })

      const result = await provider.generateText('Say hello')
      expect(result).toBe('Hello from Gemini')
    })

    it('returns parsed JSON when API response is valid JSON string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: '{"key":"value","num":42}' }] } },
          ],
        }),
      })

      const result = await provider.generateText('Return JSON')
      expect(result).toEqual({ key: 'value', num: 42 })
    })

    it('returns null when candidates array is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [] }),
      })

      const result = await provider.generateText('Empty')
      expect(result).toBeNull()
    })

    it('returns null when content parts have no text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [] } }],
        }),
      })

      const result = await provider.generateText('No text parts')
      expect(result).toBeNull()
    })

    it('throws a meaningful error on non-OK HTTP response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      })

      await expect(provider.generateText('Bad prompt')).rejects.toThrow(
        '[GeminiProvider] generateText failed (400)'
      )
    })

    it('throws on network-level failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fetch failed'))

      await expect(provider.generateText('Network fail')).rejects.toThrow('fetch failed')
    })

    it('throws when GOOGLE_API_KEY is not set', async () => {
      delete process.env.GOOGLE_API_KEY

      await expect(provider.generateText('No key')).rejects.toThrow(
        '[GeminiProvider] GOOGLE_API_KEY is not set.'
      )

      process.env.GOOGLE_API_KEY = 'test-google-api-key'
    })

    it('calls the correct Gemini generateContent endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }),
      })

      await provider.generateText('test', 'gemini-1.5-pro')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-1.5-pro:generateContent'),
        expect.objectContaining({ method: 'POST' })
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-google-api-key'),
        expect.anything()
      )
    })
  })

  // ── streamText ───────────────────────────────────────────────────────
  describe('streamText', () => {
    function makeStreamResponse(chunks: string[]) {
      let index = 0
      const encoder = new TextEncoder()
      return {
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (index >= chunks.length) return { done: true, value: undefined }
              return { done: false, value: encoder.encode(chunks[index++]) }
            },
          }),
        },
      }
    }

    it('yields text chunks from Gemini SSE stream', async () => {
      const sseChunk =
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n' +
        'data: {"candidates":[{"content":{"parts":[{"text":" Gemini"}]}}]}\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('stream test')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' Gemini'])
    })

    it('throws on non-OK stream response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Unavailable',
      })

      const gen = provider.streamText('fail')
      await expect(gen.next()).rejects.toThrow('[GeminiProvider] streamText failed (503)')
    })

    it('skips empty data lines without throwing', async () => {
      const sseChunk =
        'data: \n' +
        'data: {"candidates":[{"content":{"parts":[{"text":"Valid"}]}}]}\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('skip empty')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Valid'])
    })

    it('skips malformed JSON lines without throwing', async () => {
      const sseChunk =
        'data: {broken-json\n' +
        'data: {"candidates":[{"content":{"parts":[{"text":"OK"}]}}]}\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('malformed')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['OK'])
    })
  })

  // ── translateMultipleKeys ─────────────────────────────────────────────
  describe('translateMultipleKeys', () => {
    it('returns empty object for empty items array', async () => {
      const result = await provider.translateMultipleKeys([], 'fr')
      expect(result).toEqual({})
    })

    it('returns empty object when all items have blank text', async () => {
      const result = await provider.translateMultipleKeys(
        [{ key: 'x', text: '  ' }],
        'fr'
      )
      expect(result).toEqual({})
    })

    it('returns translated key-value pairs on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: '{"hello":"Hallo","world":"Welt"}' }] } },
          ],
        }),
      })

      const result = await provider.translateMultipleKeys(
        [
          { key: 'hello', text: 'Hello' },
          { key: 'world', text: 'World' },
        ],
        'de'
      )

      expect(result).toEqual({ hello: 'Hallo', world: 'Welt' })
    })

    it('strips markdown code fences from translation response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: '```json\n{"title":"Titre"}\n```' }] } },
          ],
        }),
      })

      const result = await provider.translateMultipleKeys(
        [{ key: 'title', text: 'Title' }],
        'fr'
      )

      expect(result).toEqual({ title: 'Titre' })
    })

    it('gracefully skips chunk on API error without throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Quota exceeded',
      })

      const result = await provider.translateMultipleKeys(
        [{ key: 'label', text: 'Click me' }],
        'ja'
      )

      expect(result).toEqual({})
    })
  })
})
