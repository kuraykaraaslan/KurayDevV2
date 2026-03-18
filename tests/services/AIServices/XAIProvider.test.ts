// Mock global fetch before any imports that might use it
const mockFetch = jest.fn()
global.fetch = mockFetch

import { XAIProvider } from '@/services/AIServices/XAIProvider'

describe('XAIProvider', () => {
  let provider: XAIProvider
  const originalApiKey = process.env.XAI_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.XAI_API_KEY = 'test-xai-api-key'
    provider = new XAIProvider()
  })

  afterAll(() => {
    process.env.XAI_API_KEY = originalApiKey
  })

  // ── getModels ────────────────────────────────────────────────────────
  describe('getModels', () => {
    it('returns a non-empty list of hardcoded models', async () => {
      const models = await provider.getModels()
      expect(models.length).toBeGreaterThan(0)
    })

    it('all returned models have XAI provider', async () => {
      const models = await provider.getModels()
      for (const m of models) {
        expect(m.provider).toBe('XAI')
      }
    })

    it('includes grok-3 in the model list', async () => {
      const models = await provider.getModels()
      const names = models.map((m) => m.modelName)
      expect(names).toContain('grok-3')
    })

    it('includes grok-3-mini in the model list', async () => {
      const models = await provider.getModels()
      const names = models.map((m) => m.modelName)
      expect(names).toContain('grok-3-mini')
    })
  })

  // ── generateText ─────────────────────────────────────────────────────
  describe('generateText', () => {
    it('returns plain text from a successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello from Grok' } }],
        }),
      })

      const result = await provider.generateText('Say hello')
      expect(result).toBe('Hello from Grok')
    })

    it('returns parsed JSON when model response is a valid JSON string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"status":"ready","version":3}' } }],
        }),
      })

      const result = await provider.generateText('Return JSON')
      expect(result).toEqual({ status: 'ready', version: 3 })
    })

    it('returns null when choices array is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }),
      })

      const result = await provider.generateText('Empty choices')
      expect(result).toBeNull()
    })

    it('returns null when message content is null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: null } }],
        }),
      })

      const result = await provider.generateText('Null content')
      expect(result).toBeNull()
    })

    it('throws a meaningful error on non-OK HTTP response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      })

      await expect(provider.generateText('Forbidden prompt')).rejects.toThrow(
        '[XAIProvider] generateText failed (403)'
      )
    })

    it('throws on network-level failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network unreachable'))

      await expect(provider.generateText('Network fail')).rejects.toThrow('Network unreachable')
    })

    it('throws when XAI_API_KEY is not set', async () => {
      delete process.env.XAI_API_KEY

      await expect(provider.generateText('No key')).rejects.toThrow(
        '[XAIProvider] XAI_API_KEY is not set.'
      )

      process.env.XAI_API_KEY = 'test-xai-api-key'
    })

    it('sends Authorization Bearer header and posts to xAI completions endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
      })

      await provider.generateText('test', 'grok-3-fast')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.x.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-xai-api-key',
          }),
        })
      )
    })

    it('defaults to grok-3 model when none is specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
      })

      await provider.generateText('test with default model')

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.model).toBe('grok-3')
    })

    it('includes the specified model in the request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
      })

      await provider.generateText('test', 'grok-3-mini-fast')

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.model).toBe('grok-3-mini-fast')
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

    it('yields delta content chunks from SSE stream', async () => {
      const sseChunk =
        'data: {"choices":[{"delta":{"content":"Grok"}}]}\n' +
        'data: {"choices":[{"delta":{"content":" says hi"}}]}\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('stream test')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Grok', ' says hi'])
    })

    it('stops at [DONE] sentinel', async () => {
      const sseChunk =
        'data: {"choices":[{"delta":{"content":"X"}}]}\n' +
        'data: [DONE]\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('done test')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['X'])
    })

    it('handles multi-chunk SSE delivery correctly', async () => {
      const chunk1 = 'data: {"choices":[{"delta":{"content":"Part1"}}]}\n'
      const chunk2 = 'data: {"choices":[{"delta":{"content":"Part2"}}]}\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([chunk1, chunk2]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('multi-chunk')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Part1', 'Part2'])
    })

    it('throws on non-OK stream response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limited',
      })

      const gen = provider.streamText('rate limited')
      await expect(gen.next()).rejects.toThrow('[XAIProvider] streamText failed (429)')
    })

    it('skips malformed JSON SSE lines without throwing', async () => {
      const sseChunk =
        'data: not-valid-json\n' +
        'data: {"choices":[{"delta":{"content":"Valid"}}]}\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('malformed')) {
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

    it('returns empty object when all items have blank text', async () => {
      const result = await provider.translateMultipleKeys(
        [{ key: 'x', text: '  ' }],
        'de'
      )
      expect(result).toEqual({})
    })

    it('returns translated key-value pairs on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"login":"Connexion","logout":"Déconnexion"}' } }],
        }),
      })

      const result = await provider.translateMultipleKeys(
        [
          { key: 'login', text: 'Login' },
          { key: 'logout', text: 'Logout' },
        ],
        'fr'
      )

      expect(result).toEqual({ login: 'Connexion', logout: 'Déconnexion' })
    })

    it('strips markdown code fences from translation response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '```\n{"back":"Zurück"}\n```' } }],
        }),
      })

      const result = await provider.translateMultipleKeys(
        [{ key: 'back', text: 'Back' }],
        'de'
      )

      expect(result).toEqual({ back: 'Zurück' })
    })

    it('gracefully skips chunk on API error without throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      })

      const result = await provider.translateMultipleKeys(
        [{ key: 'btn', text: 'Confirm' }],
        'it'
      )

      expect(result).toEqual({})
    })

    it('uses grok-3 as the default model for translation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"ok":"OK"}' } }],
        }),
      })

      await provider.translateMultipleKeys([{ key: 'ok', text: 'OK' }], 'fr')

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.model).toBe('grok-3')
    })

    it('uses custom model when specified in opts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"ok":"OK"}' } }],
        }),
      })

      await provider.translateMultipleKeys(
        [{ key: 'ok', text: 'OK' }],
        'fr',
        'en',
        { model: 'grok-3-mini' }
      )

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.model).toBe('grok-3-mini')
    })
  })
})
