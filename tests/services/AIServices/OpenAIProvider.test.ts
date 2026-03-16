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

import openai from '@/libs/openai'
import OpenAIProvider from '@/services/AIServices/OpenAIProvider'

describe('OpenAIProvider', () => {
  const openaiMock = openai as any

  beforeEach(() => {
    jest.clearAllMocks()
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
})
