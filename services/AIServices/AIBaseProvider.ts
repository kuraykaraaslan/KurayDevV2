import { AIMmodelOption, AIMProviderType } from '@/types/features/AITypes'

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

export abstract class AIBaseProvider {
  abstract readonly provider: AIMProviderType

  /** Fetch available models from the provider API. */
  abstract getModels(): Promise<AIMmodelOption[]>

  /** Generate text from a prompt using the given model. */
  abstract generateText(prompt: string, model?: string): Promise<string | null>

  /** Stream text from a prompt, yielding chunks as they arrive. */
  abstract streamText(prompt: string, model?: string): AsyncGenerator<string, void, unknown>

  /** Stream text from a structured messages array (preserves system prompt). */
  abstract streamMessages(messages: ChatMsg[], model?: string): AsyncGenerator<string, void, unknown>

  /** Batch-translate UI string keys from source to target language. */
  abstract translateMultipleKeys(
    items: { key: string; text: string }[],
    targetLanguage: string,
    sourceLanguage?: string,
    opts?: { batchSize?: number; model?: string }
  ): Promise<Record<string, string>>

  /** Generate an image from a prompt. Override in providers that support it. */
  async generateImage(
    _prompt: string,
    _width?: number,
    _height?: number
  ): Promise<string | null> {
    throw new Error(`generateImage is not supported by ${this.provider}`)
  }
}
