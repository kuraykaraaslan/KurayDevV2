// Mock global fetch before any imports that might use it
const mockFetch = jest.fn()
global.fetch = mockFetch

import { AnthropicProvider } from '@/services/AIServices/AnthropicProvider'

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider
  const originalApiKey = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-api-key'
    provider = new AnthropicProvider()
  })

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey
  })

  // ── getModels ────────────────────────────────────────────────────────
  describe('getModels', () => {
    it('returns a non-empty list of hardcoded models', async () => {
      const models = await provider.getModels()
      expect(models.length).toBeGreaterThan(0)
    })

    it('all returned models have ANTHROPIC provider', async () => {
      const models = await provider.getModels()
      for (const m of models) {
        expect(m.provider).toBe('ANTHROPIC')
      }
    })

    it('includes claude-sonnet-4-6 in the model list', async () => {
      const models = await provider.getModels()
      const names = models.map((m) => m.modelName)
      expect(names).toContain('claude-sonnet-4-6')
    })
  })

  // ── generateText ─────────────────────────────────────────────────────
  describe('generateText', () => {
    it('returns raw text when API response is plain text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'Hello from Claude' }],
        }),
      })

      const result = await provider.generateText('Say hello')
      expect(result).toBe('Hello from Claude')
    })

    it('returns parsed JSON when API response is valid JSON string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: '{"status":"ok","count":3}' }],
        }),
      })

      const result = await provider.generateText('Return JSON')
      expect(result).toEqual({ status: 'ok', count: 3 })
    })

    it('returns null when content array is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [] }),
      })

      const result = await provider.generateText('Empty response')
      expect(result).toBeNull()
    })

    it('returns null when no text content block is present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'image', source: {} }],
        }),
      })

      const result = await provider.generateText('Image only')
      expect(result).toBeNull()
    })

    it('throws a meaningful error on non-OK HTTP response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      })

      await expect(provider.generateText('Overloaded')).rejects.toThrow(
        '[AnthropicProvider] generateText failed (429)'
      )
    })

    it('throws on network-level failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      await expect(provider.generateText('Network fail')).rejects.toThrow('Connection refused')
    })

    it('throws when ANTHROPIC_API_KEY is not set', async () => {
      delete process.env.ANTHROPIC_API_KEY

      await expect(provider.generateText('No key')).rejects.toThrow(
        '[AnthropicProvider] ANTHROPIC_API_KEY is not set.'
      )

      process.env.ANTHROPIC_API_KEY = 'test-anthropic-api-key'
    })

    it('sends request to Anthropic messages endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: 'OK' }] }),
      })

      await provider.generateText('Test prompt', 'claude-haiku-4-5-20251001')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-anthropic-api-key',
            'anthropic-version': '2023-06-01',
          }),
        })
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

    it('yields delta text chunks from SSE stream', async () => {
      const sseChunk =
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n' +
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('stream prompt')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' world'])
    })

    it('stops yielding at [DONE] sentinel', async () => {
      const sseChunk =
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"A"}}\n' +
        'data: [DONE]\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('stop prompt')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['A'])
    })

    it('throws a meaningful error on non-OK stream response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Service unavailable',
      })

      const gen = provider.streamText('fail prompt')
      await expect(gen.next()).rejects.toThrow('[AnthropicProvider] streamText failed (503)')
    })

    it('skips malformed JSON lines without throwing', async () => {
      const sseChunk =
        'data: not-valid-json\n' +
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Valid"}}\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('malformed prompt')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Valid'])
    })
  })

  // ── translateMultipleKeys ─────────────────────────────────────────────
  describe('translateMultipleKeys', () => {
    it('returns empty object for empty items array', async () => {
      const result = await provider.translateMultipleKeys([], 'fr')
      expect(result).toEqual({})
    })

    it('returns empty object when all items have empty text', async () => {
      const result = await provider.translateMultipleKeys(
        [{ key: 'greeting', text: '   ' }],
        'fr'
      )
      expect(result).toEqual({})
    })

    it('returns translated key-value pairs on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: '{"greeting":"Bonjour","farewell":"Au revoir"}' }],
        }),
      })

      const result = await provider.translateMultipleKeys(
        [
          { key: 'greeting', text: 'Hello' },
          { key: 'farewell', text: 'Goodbye' },
        ],
        'fr'
      )

      expect(result).toEqual({ greeting: 'Bonjour', farewell: 'Au revoir' })
    })

    it('strips markdown code fences from the response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: '```json\n{"title":"Titre"}\n```' }],
        }),
      })

      const result = await provider.translateMultipleKeys(
        [{ key: 'title', text: 'Title' }],
        'fr'
      )

      expect(result).toEqual({ title: 'Titre' })
    })

    it('skips chunk when API returns non-OK status (graceful degradation)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal error',
      })

      const result = await provider.translateMultipleKeys(
        [{ key: 'label', text: 'Submit' }],
        'de'
      )

      // chunk failed gracefully — key is not included but no throw
      expect(result).toEqual({})
    })

    it('skips keys with missing translation values in API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: '{"greeting":"Hola"}' }],
        }),
      })

      const result = await provider.translateMultipleKeys(
        [
          { key: 'greeting', text: 'Hello' },
          { key: 'missing_key', text: 'Something' },
        ],
        'es'
      )

      expect(result.greeting).toBe('Hola')
      expect(result.missing_key).toBeUndefined()
    })
  })
})
