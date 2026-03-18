import OpenAIService from '@/services/OpenAIService'
import OpenAIProvider from '@/services/AIServices/OpenAIProvider'

describe('OpenAIService (backward-compatible re-export)', () => {
  it('re-exports OpenAIProvider default instance', () => {
    expect(OpenAIService).toBe(OpenAIProvider)
  })
})
