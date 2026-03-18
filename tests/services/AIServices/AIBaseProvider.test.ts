import { AIBaseProvider } from '@/services/AIServices/AIBaseProvider'

class DummyProvider extends AIBaseProvider {
  readonly provider = 'OPENAI' as const

  async getModels(): Promise<any[]> {
    return []
  }

  async generateText(): Promise<string | null> {
    return null
  }

  async *streamText(): AsyncGenerator<string, void, unknown> {
    yield 'x'
  }

  async *streamMessages(): AsyncGenerator<string, void, unknown> {
    yield 'x'
  }

  async translateMultipleKeys(): Promise<Record<string, string>> {
    return {}
  }
}

describe('AIBaseProvider', () => {
  it('throws by default for generateImage', async () => {
    const p = new DummyProvider()
    await expect(p.generateImage('p')).rejects.toThrow('generateImage is not supported')
  })
})
