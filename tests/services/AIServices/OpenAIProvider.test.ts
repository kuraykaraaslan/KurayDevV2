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

describe('OpenAIProvider', () => {
  const openaiMock = openai as any
  const redisMock = redis as any

  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  describe('getModels', () => {
    it('returns cached models when present', async () => {
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify([{ id: 'OPENAI:gpt-4o', label: 'GPT-4o', provider: 'OPENAI', modelName: 'gpt-4o' }])
      )

      const models = await OpenAIProvider.getModels()
      expect(models).toHaveLength(1)
      expect(openaiMock.models.list).not.toHaveBeenCalled()
    })

    it('fetches models and caches filtered chat families', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      openaiMock.models.list.mockResolvedValueOnce({
        data: [
          { id: 'gpt-4o', created: 10 },
          { id: 'gpt-4o-realtime-preview', created: 11 },
          { id: 'gpt-3.5-turbo', created: 9 },
          { id: 'o1', created: 12 },
          { id: 'text-embedding-3-small', created: 8 },
        ],
      })

      const models = await OpenAIProvider.getModels()
      const names = models.map((m: any) => m.modelName)

      expect(names).toContain('o1')
      expect(names).toContain('gpt-4o')
      expect(names).toContain('gpt-3.5-turbo')
      expect(names).not.toContain('gpt-4o-realtime-preview')
      expect(names).not.toContain('text-embedding-3-small')
      expect(redisMock.set).toHaveBeenCalled()
    })
  })

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

  describe('streamText', () => {
    it('yields only chunks with delta content', async () => {
      async function* gen() {
        yield { choices: [{ delta: { content: 'a' } }] }
        yield { choices: [{ delta: { content: null } }] }
        yield { choices: [{ delta: { content: 'b' } }] }
      }

      openaiMock.chat.completions.create.mockResolvedValueOnce(gen())

      const out: string[] = []
      for await (const c of OpenAIProvider.streamText('hi')) out.push(c)
      expect(out).toEqual(['a', 'b'])
    })
  })

  describe('generateImage', () => {
    it('throws on invalid sizes', async () => {
      await expect(OpenAIProvider.generateImage('p', 100, 100)).rejects.toThrow('Invalid image size')
    })

    it('returns null when OpenAI image generation throws', async () => {
      openaiMock.images.generate.mockRejectedValueOnce(new Error('boom'))

      const url = await OpenAIProvider.generateImage('p', 1024, 1024)
      expect(url).toBeNull()
    })

    it('returns url when provided', async () => {
      openaiMock.images.generate.mockResolvedValueOnce({ data: [{ url: 'https://img' }] })

      const url = await OpenAIProvider.generateImage('p', 1024, 1024)
      expect(url).toBe('https://img')
    })
  })

  describe('translateMultipleKeys', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    afterEach(() => {
      ;(console.error as any).mockRestore?.()
      ;(console.warn as any).mockRestore?.()
    })

    it('returns {} for empty items', async () => {
      await expect(OpenAIProvider.translateMultipleKeys([], 'tr')).resolves.toEqual({})
    })

    it('returns {} when all items are empty/invalid', async () => {
      const r = await OpenAIProvider.translateMultipleKeys(
        [
          { key: 'a', text: '' },
          { key: 'b', text: '   ' },
        ],
        'tr'
      )
      expect(r).toEqual({})
    })

    it('does not throw when OPENAI_API_KEY is missing (returns empty result)', async () => {
      delete process.env.OPENAI_API_KEY

      const r = await OpenAIProvider.translateMultipleKeys([{ key: 'hello', text: 'Hello' }], 'tr')
      expect(r).toEqual({})
    })

    it('parses JSON wrapped in code fences and returns mapped keys', async () => {
      process.env.OPENAI_API_KEY = 'x'

      openaiMock.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '```json\n{\n  "hello": "Merhaba"\n}\n```',
            },
          },
        ],
      })

      const r = await OpenAIProvider.translateMultipleKeys([{ key: 'hello', text: 'Hello' }], 'tr')
      expect(r).toEqual({ hello: 'Merhaba' })
    })

    it('skips missing translated values per key', async () => {
      process.env.OPENAI_API_KEY = 'x'

      openaiMock.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '{"hello":"","bye":"Güle güle"}',
            },
          },
        ],
      })

      const r = await OpenAIProvider.translateMultipleKeys(
        [
          { key: 'hello', text: 'Hello' },
          { key: 'bye', text: 'Bye' },
        ],
        'tr'
      )
      expect(r).toEqual({ bye: 'Güle güle' })
    })
  })
})
