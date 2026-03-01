import { AIMmodelOption, AIMProviderType } from '@/types/features/AITypes'

export abstract class AIBaseProvider {
  abstract readonly provider: AIMProviderType

  /** Fetch available models from the provider API. */
  abstract getModels(): Promise<AIMmodelOption[]>

  /** Generate text from a prompt using the given model. */
  abstract generateText(prompt: string, model?: string): Promise<string | null>

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
