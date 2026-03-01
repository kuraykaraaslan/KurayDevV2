// Base Provider
import { AIBaseProvider } from './AIBaseProvider'

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
  /**
   * Get provider instance by type key. Defaults to OpenAI.
   */
  static getProvider(type?: string | null): AIBaseProvider {
    switch (type) {
      case 'GOOGLE_GENAI': return GeminiProvider
      case 'ANTHROPIC':    return AnthropicProvider
      case 'DEEPSEEK':     return DeepSeekProvider
      case 'XAI':          return XAIProvider
      case 'OPENAI':
      default:             return OpenAIProvider
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
