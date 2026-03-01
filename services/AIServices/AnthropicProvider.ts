import { AIMmodelOption, serializeAIModel } from '@/types/features/AITypes'
import { AIBaseProvider } from './AIBaseProvider'

const BASE_URL = 'https://api.anthropic.com/v1'
const API_VERSION = '2023-06-01'

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('[AnthropicProvider] ANTHROPIC_API_KEY is not set.')
  return key
}

const MODELS: AIMmodelOption[] = [
  { id: serializeAIModel('ANTHROPIC', 'claude-opus-4-6'),            label: 'Claude Opus 4.6',      provider: 'ANTHROPIC', modelName: 'claude-opus-4-6' },
  { id: serializeAIModel('ANTHROPIC', 'claude-sonnet-4-6'),          label: 'Claude Sonnet 4.6',    provider: 'ANTHROPIC', modelName: 'claude-sonnet-4-6' },
  { id: serializeAIModel('ANTHROPIC', 'claude-haiku-4-5-20251001'),  label: 'Claude Haiku 4.5',     provider: 'ANTHROPIC', modelName: 'claude-haiku-4-5-20251001' },
  { id: serializeAIModel('ANTHROPIC', 'claude-3-5-sonnet-20241022'), label: 'Claude 3.5 Sonnet',    provider: 'ANTHROPIC', modelName: 'claude-3-5-sonnet-20241022' },
  { id: serializeAIModel('ANTHROPIC', 'claude-3-5-haiku-20241022'),  label: 'Claude 3.5 Haiku',     provider: 'ANTHROPIC', modelName: 'claude-3-5-haiku-20241022' },
]

export class AnthropicProvider extends AIBaseProvider {
  readonly provider = 'ANTHROPIC' as const

  async getModels(): Promise<AIMmodelOption[]> {
    return MODELS
  }

  async generateText(prompt: string, model: string = 'claude-sonnet-4-6'): Promise<string | null> {
    const res = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey(),
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: 'You are a Content Management System API.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`[AnthropicProvider] generateText failed (${res.status}): ${err}`)
    }

    const data = await res.json() as {
      content?: { type: string; text?: string }[]
    }

    const text = data.content?.find((c) => c.type === 'text')?.text ?? null
    if (!text) return null

    try { return JSON.parse(text) } catch { return text }
  }

  async translateMultipleKeys(
    items: { key: string; text: string }[],
    targetLanguage: string,
    sourceLanguage: string = 'en',
    opts?: { batchSize?: number; model?: string }
  ): Promise<Record<string, string>> {
    const batchSize = opts?.batchSize ?? 40
    const model = opts?.model ?? 'claude-sonnet-4-6'

    if (!items?.length) return {}

    const clean = items.filter(
      (x) => x && typeof x.key === 'string' && typeof x.text === 'string' && x.text.trim().length > 0
    )
    if (!clean.length) return {}

    const result: Record<string, string> = {}

    for (let i = 0; i < clean.length; i += batchSize) {
      const chunk = clean.slice(i, i + batchSize)

      const payload = chunk.reduce((acc, cur) => {
        acc[cur.key] = cur.text
        return acc
      }, {} as Record<string, string>)

      const prompt = [
        `Translate the VALUES of the following JSON object from ${sourceLanguage} to ${targetLanguage}.`,
        `- Do NOT translate the keys.`,
        `- Return ONLY valid JSON.`,
        `- Keep placeholders like {name}, {{count}}, %s, and HTML tags unchanged.`,
        `- Use natural ${targetLanguage} suitable for a UI.`,
        ``,
        `JSON to translate:`,
        JSON.stringify(payload, null, 2),
      ].join('\n')

      let translated: any = null

      try {
        const res = await fetch(`${BASE_URL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey(),
            'anthropic-version': API_VERSION,
          },
          body: JSON.stringify({
            model,
            max_tokens: 4000,
            system: 'You are a translation engine. You ONLY output strict JSON. Never output markdown or extra text.',
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`)

        const data = await res.json() as {
          content?: { type: string; text?: string }[]
        }

        const content = data.content?.find((c) => c.type === 'text')?.text?.trim()
        if (!content) throw new Error('Empty translation response.')

        const jsonText = content
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim()

        translated = JSON.parse(jsonText)
      } catch (err) {
        console.error('[AnthropicProvider] Translation chunk failed:', err)
        translated = null
      }

      if (!translated || typeof translated !== 'object') {
        console.error('[AnthropicProvider] Invalid translation for chunk:', i / batchSize)
        continue
      }

      for (const { key } of chunk) {
        const val = translated[key]
        if (typeof val === 'string' && val.trim().length > 0) {
          result[key] = val
        } else {
          console.warn('[AnthropicProvider] Missing translated value for key:', key)
        }
      }
    }

    return result
  }
}

export default new AnthropicProvider()
