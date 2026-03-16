// Base Provider
import { AIBaseProvider } from './AIBaseProvider'
import redisInstance from '@/libs/redis'
import AIMessages from '@/messages/AIMessages'

// AI Providers
import OpenAIProvider from './OpenAIProvider'
import GeminiProvider from './GeminiProvider'
import AnthropicProvider from './AnthropicProvider'
import DeepSeekProvider from './DeepSeekProvider'
import XAIProvider from './XAIProvider'

// Re-export everything
export { AIBaseProvider }
export { OpenAIProvider, GeminiProvider, AnthropicProvider, DeepSeekProvider, XAIProvider }

export class AIService {
  private static readonly PROMPT_MAX_LENGTH = 12_000

  private static readonly PROMPT_INJECTION_PATTERNS: RegExp[] = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions?/i,
    /reveal\s+(the\s+)?(system|developer)\s+prompt/i,
    /you\s+are\s+now\s+(in\s+)?developer\s+mode/i,
    /bypass\s+(safety|guardrails?|policy)/i,
  ]

  private static readonly MODEL_PATTERNS: Record<string, RegExp[]> = {
    OPENAI: [/^gpt-/i, /^o\d/i],
    GOOGLE_GENAI: [/^gemini-/i],
    ANTHROPIC: [/^claude-/i],
    DEEPSEEK: [/^deepseek-/i],
    XAI: [/^grok-/i],
  }

  static normalizeProvider(type?: string | null): string {
    return (type ?? 'OPENAI').trim().toUpperCase()
  }

  /**
   * Get provider instance by type key. Defaults to OpenAI.
   */
  static getProvider(type?: string | null): AIBaseProvider {
    const normalizedType = this.normalizeProvider(type)

    switch (normalizedType) {
      case 'GOOGLE_GENAI': return GeminiProvider
      case 'ANTHROPIC':    return AnthropicProvider
      case 'DEEPSEEK':     return DeepSeekProvider
      case 'XAI':          return XAIProvider
      case 'OPENAI':       return OpenAIProvider
      default:             throw new Error(AIMessages.UNSUPPORTED_PROVIDER)
    }
  }

  static assertSupportedModel(provider: AIBaseProvider, model?: string): void {
    if (!model?.trim()) return

    const patterns = this.MODEL_PATTERNS[provider.provider]
    if (!patterns || patterns.some((p) => p.test(model))) return

    throw new Error(AIMessages.MODEL_NOT_AVAILABLE)
  }

  static assertPromptSafe(prompt: string): void {
    if (!prompt?.trim()) throw new Error(AIMessages.PROMPT_REQUIRED)
    if (prompt.length > this.PROMPT_MAX_LENGTH) throw new Error(AIMessages.PROMPT_TOO_LONG)

    const unsafe = this.PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(prompt))
    if (unsafe) throw new Error(AIMessages.PROMPT_INJECTION_DETECTED)
  }

  static async enforceUsageLimit(identifier: string): Promise<void> {
    const normalized = identifier.trim() || 'anonymous'
    const minuteBucket = Math.floor(Date.now() / 60_000)
    const key = `ai:usage:${normalized}:${minuteBucket}`
    const rawLimit = Number(process.env.AI_USAGE_LIMIT_PER_MINUTE ?? '30')
    const maxRequestsPerMinute = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 30

    try {
      const count = await redisInstance.incr(key)
      if (count === 1) {
        await redisInstance.expire(key, 90)
      }

      if (count > maxRequestsPerMinute) {
        throw new Error(AIMessages.RATE_LIMIT_EXCEEDED)
      }
    } catch (error) {
      if (error instanceof Error && error.message === AIMessages.RATE_LIMIT_EXCEEDED) {
        throw error
      }
      // Redis unavailable should not break generation endpoint.
    }
  }

  /**
   * Get all registered provider instances (used for listing models).
   */
  static getAllProviders(): AIBaseProvider[] {
    return [
      OpenAIProvider,
      GeminiProvider,
      AnthropicProvider,
      DeepSeekProvider,
      XAIProvider,
    ]
  }
}
