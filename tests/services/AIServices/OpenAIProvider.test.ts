jest.mock('@/libs/openai', () => ({
  __esModule: true,
  default: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    models: {
      list: jest.fn(),
    },
    images: {
      generate: jest.fn(),
    },
  },
}))

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

import openai from '@/libs/openai'
import redis from '@/libs/redis'
import OpenAIProvider from '@/services/AIServices/OpenAIProvider'

const redisMock = redis as jest.Mocked<typeof redis>

describe('OpenAIProvider', () => {
  const openaiMock = openai as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── generateText ──────────────────────────────────────────────────────────
  describe('generateText', () => {
    it('returns parsed JSON when model response is valid JSON', async () => {
      openaiMock.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: '{"ok":true}' } }],
      })

      const result = await OpenAIProvider.generateText('hello', 'gpt-4o')
      expect(result).toEqual({ ok: true })
    })

    it('returns raw text when model response is not valid JSON', async () => {
      openaiMock.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: 'plain-text-response' } }],
      })

      const result = await OpenAIProvider.generateText('hello', 'gpt-4o')
      expect(result).toBe('plain-text-response')
    })

    it('returns null when model returns empty content', async () => {
      openaiMock.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      })

      const result = await OpenAIProvider.generateText('hello', 'gpt-4o')
      expect(result).toBeNull()
    })
  })

  // ── streamText ────────────────────────────────────────────────────────────
  describe('streamText', () => {
    it('yields each delta content chunk from the stream', async () => {
      const fakeStream = (async function* () {
        yield { choices: [{ delta: { content: 'Hello' } }] }
        yield { choices: [{ delta: { content: ' world' } }] }
        yield { choices: [{ delta: {} }] } // no content → skip
      })()
      openaiMock.chat.completions.create.mockResolvedValueOnce(fakeStream)

      const chunks: string[] = []
      for await (const chunk of OpenAIProvider.streamText('prompt', 'gpt-4o')) {
        chunks.push(chunk)
      }
      expect(chunks).toEqual(['Hello', ' world'])
    })
  })

  // ── getModels ─────────────────────────────────────────────────────────────
  describe('getModels', () => {
    it('returns cached models when Redis cache is populated', async () => {
      const cached = [{ id: 'OPENAI:gpt-4o', label: 'GPT-4o', provider: 'OPENAI', modelName: 'gpt-4o' }]
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cached))

      const result = await OpenAIProvider.getModels()
      expect(result).toEqual(cached)
      expect(openaiMock.models.list).not.toHaveBeenCalled()
    })

    it('fetches from API and caches on cache miss', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      openaiMock.models.list.mockResolvedValueOnce({
        data: [
          { id: 'gpt-4o', created: 1700000000 },
          { id: 'gpt-3.5-turbo', created: 1600000000 },
          { id: 'text-embedding-ada-002', created: 1500000000 }, // excluded
          { id: 'dall-e-3', created: 1400000000 }, // excluded
        ],
      })
      redisMock.set.mockResolvedValueOnce('OK')

      const result = await OpenAIProvider.getModels()
      expect(result.some((m) => m.modelName === 'gpt-4o')).toBe(true)
      expect(result.some((m) => m.modelName === 'text-embedding-ada-002')).toBe(false)
      expect(result.some((m) => m.modelName === 'dall-e-3')).toBe(false)
      expect(redisMock.set).toHaveBeenCalled()
    })
  })

  // ── generateImage ─────────────────────────────────────────────────────────
  describe('generateImage', () => {
    it('returns image URL on success', async () => {
      openaiMock.images.generate.mockResolvedValueOnce({
        data: [{ url: 'https://oaidalleapi.blob.core.windows.net/image.png' }],
      })

      const url = await OpenAIProvider.generateImage('a futuristic city', 1792, 1024)
      expect(url).toBe('https://oaidalleapi.blob.core.windows.net/image.png')
    })

    it('returns null when data array is empty', async () => {
      openaiMock.images.generate.mockResolvedValueOnce({ data: [] })
      const url = await OpenAIProvider.generateImage('test', 1024, 1024)
      expect(url).toBeNull()
    })

    it('throws for invalid image size', async () => {
      await expect(OpenAIProvider.generateImage('test', 999, 999)).rejects.toThrow('Invalid image size')
    })

    it('returns null when generate throws (catch block)', async () => {
      openaiMock.images.generate.mockRejectedValueOnce(new Error('rate limit'))
      const url = await OpenAIProvider.generateImage('test', 1024, 1024)
      expect(url).toBeNull()
    })
  })

  // ── translateMultipleKeys ─────────────────────────────────────────────────
  describe('translateMultipleKeys', () => {
    it('returns empty object for empty items array', async () => {
      const result = await OpenAIProvider.translateMultipleKeys([], 'tr')
      expect(result).toEqual({})
    })

    it('returns empty object when all items have empty text', async () => {
      const result = await OpenAIProvider.translateMultipleKeys(
        [{ key: 'k1', text: '   ' }],
        'tr'
      )
      expect(result).toEqual({})
    })

    it('translates items and returns key→translated map', async () => {
      process.env.OPENAI_API_KEY = 'test-key'
      openaiMock.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ greeting: 'Merhaba' }) } }],
      })

      const result = await OpenAIProvider.translateMultipleKeys(
        [{ key: 'greeting', text: 'Hello' }],
        'tr'
      )
      expect(result).toEqual({ greeting: 'Merhaba' })
    })

    it('skips batch when OPENAI_API_KEY is missing', async () => {
      delete process.env.OPENAI_API_KEY
      const result = await OpenAIProvider.translateMultipleKeys(
        [{ key: 'k', text: 'hello' }],
        'tr'
      )
      expect(result).toEqual({})
    })

    it('handles markdown-fenced JSON from model', async () => {
      process.env.OPENAI_API_KEY = 'test-key'
      openaiMock.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: '```json\n{"k": "v"}\n```' } }],
      })

      const result = await OpenAIProvider.translateMultipleKeys([{ key: 'k', text: 'val' }], 'tr')
      expect(result).toEqual({ k: 'v' })
    })
  })
})
