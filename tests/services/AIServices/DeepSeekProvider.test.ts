// Mock global fetch before any imports that might use it
const mockFetch = jest.fn()
global.fetch = mockFetch

import { DeepSeekProvider } from '@/services/AIServices/DeepSeekProvider'

describe('DeepSeekProvider', () => {
  let provider: DeepSeekProvider
  const originalApiKey = process.env.DEEPSEEK_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-api-key'
    provider = new DeepSeekProvider()
  })

  afterAll(() => {
    process.env.DEEPSEEK_API_KEY = originalApiKey
  })

  // ── getModels ────────────────────────────────────────────────────────
  describe('getModels', () => {
    it('returns a non-empty list of hardcoded models', async () => {
      const models = await provider.getModels()
      expect(models.length).toBeGreaterThan(0)
    })

    it('all returned models have DEEPSEEK provider', async () => {
      const models = await provider.getModels()
      for (const m of models) {
        expect(m.provider).toBe('DEEPSEEK')
      }
    })

    it('includes deepseek-chat in the model list', async () => {
      const models = await provider.getModels()
      const names = models.map((m) => m.modelName)
      expect(names).toContain('deepseek-chat')
    })

    it('includes deepseek-reasoner in the model list', async () => {
      const models = await provider.getModels()
      const names = models.map((m) => m.modelName)
      expect(names).toContain('deepseek-reasoner')
    })
  })

  // ── generateText ─────────────────────────────────────────────────────
  describe('generateText', () => {
    it('returns plain text from a successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello from DeepSeek' } }],
        }),
      })

      const result = await provider.generateText('Say hello')
      expect(result).toBe('Hello from DeepSeek')
    })

    it('returns parsed JSON when model response is a valid JSON string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"answer":42}' } }],
        }),
      })

      const result = await provider.generateText('What is the answer?')
      expect(result).toEqual({ answer: 42 })
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
        status: 401,
        text: async () => 'Unauthorized',
      })

      await expect(provider.generateText('Auth fail')).rejects.toThrow(
        '[DeepSeekProvider] generateText failed (401)'
      )
    })

    it('throws on network-level failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      await expect(provider.generateText('Network fail')).rejects.toThrow('ECONNREFUSED')
    })

    it('throws when DEEPSEEK_API_KEY is not set', async () => {
      delete process.env.DEEPSEEK_API_KEY

      await expect(provider.generateText('No key')).rejects.toThrow(
        '[DeepSeekProvider] DEEPSEEK_API_KEY is not set.'
      )

      process.env.DEEPSEEK_API_KEY = 'test-deepseek-api-key'
    })

    it('sends Authorization Bearer header and posts to DeepSeek completions endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
      })

      await provider.generateText('test prompt', 'deepseek-reasoner')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-deepseek-api-key',
          }),
        })
      )
    })

    it('includes the specified model in the request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
      })

      await provider.generateText('test', 'deepseek-reasoner')

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.model).toBe('deepseek-reasoner')
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
        'data: {"choices":[{"delta":{"content":"Deep"}}]}\n' +
        'data: {"choices":[{"delta":{"content":"Seek"}}]}\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('stream prompt')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Deep', 'Seek'])
    })

    it('stops at [DONE] sentinel', async () => {
      const sseChunk =
        'data: {"choices":[{"delta":{"content":"A"}}]}\n' +
        'data: [DONE]\n'

      mockFetch.mockResolvedValueOnce(makeStreamResponse([sseChunk]))

      const chunks: string[] = []
      for await (const chunk of provider.streamText('stop test')) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['A'])
    })

    it('throws on non-OK stream response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal error',
      })

      const gen = provider.streamText('fail')
      await expect(gen.next()).rejects.toThrow('[DeepSeekProvider] streamText failed (500)')
    })

    it('skips malformed JSON SSE lines without throwing', async () => {
      const sseChunk =
        'data: {invalid-json}\n' +
        'data: {"choices":[{"delta":{"content":"OK"}}]}\n'

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
        [{ key: 'x', text: '' }],
        'es'
      )
      expect(result).toEqual({})
    })

    it('returns translated key-value pairs on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"save":"Speichern","cancel":"Abbrechen"}' } }],
        }),
      })

      const result = await provider.translateMultipleKeys(
        [
          { key: 'save', text: 'Save' },
          { key: 'cancel', text: 'Cancel' },
        ],
        'de'
      )

      expect(result).toEqual({ save: 'Speichern', cancel: 'Abbrechen' })
    })

    it('strips markdown code fences from the translation response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '```json\n{"submit":"Enviar"}\n```' } }],
        }),
      })

      const result = await provider.translateMultipleKeys(
        [{ key: 'submit', text: 'Submit' }],
        'es'
      )

      expect(result).toEqual({ submit: 'Enviar' })
    })

    it('gracefully skips chunk on API error without throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Unavailable',
      })

      const result = await provider.translateMultipleKeys(
        [{ key: 'btn', text: 'OK' }],
        'zh'
      )

      expect(result).toEqual({})
    })

    it('uses deepseek-chat as the default model for translation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"ok":"OK"}' } }],
        }),
      })

      await provider.translateMultipleKeys([{ key: 'ok', text: 'OK' }], 'fr')

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.model).toBe('deepseek-chat')
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
        { model: 'deepseek-reasoner' }
      )

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.model).toBe('deepseek-reasoner')
    })
  })
})
