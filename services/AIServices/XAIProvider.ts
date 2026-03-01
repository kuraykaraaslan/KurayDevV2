import { AIMmodelOption, serializeAIModel } from '@/types/features/AITypes'
import { AIBaseProvider } from './AIBaseProvider'

const BASE_URL = 'https://api.x.ai/v1'

function apiKey(): string {
  const key = process.env.XAI_API_KEY
  if (!key) throw new Error('[XAIProvider] XAI_API_KEY is not set.')
  return key
}

const MODELS: AIMmodelOption[] = [
  { id: serializeAIModel('XAI', 'grok-3'),           label: 'Grok 3',           provider: 'XAI', modelName: 'grok-3' },
  { id: serializeAIModel('XAI', 'grok-3-fast'),      label: 'Grok 3 Fast',      provider: 'XAI', modelName: 'grok-3-fast' },
  { id: serializeAIModel('XAI', 'grok-3-mini'),      label: 'Grok 3 Mini',      provider: 'XAI', modelName: 'grok-3-mini' },
  { id: serializeAIModel('XAI', 'grok-3-mini-fast'), label: 'Grok 3 Mini Fast', provider: 'XAI', modelName: 'grok-3-mini-fast' },
]

export class XAIProvider extends AIBaseProvider {
  readonly provider = 'XAI' as const

  async getModels(): Promise<AIMmodelOption[]> {
    return MODELS
  }

  async generateText(prompt: string, model: string = 'grok-3'): Promise<string | null> {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a Content Management System API.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4000,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`[XAIProvider] generateText failed (${res.status}): ${err}`)
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
    }

    const text = data.choices?.[0]?.message?.content ?? null
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
    const model = opts?.model ?? 'grok-3'

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
        const res = await fetch(`${BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey()}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are a translation engine. You ONLY output strict JSON. Never output markdown or extra text.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: 4000,
            temperature: 0.2,
          }),
        })

        if (!res.ok) throw new Error(`xAI API error: ${res.status}`)

        const data = await res.json() as {
          choices?: { message?: { content?: string } }[]
        }

        const content = data.choices?.[0]?.message?.content?.trim()
        if (!content) throw new Error('Empty translation response.')

        const jsonText = content
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim()

        translated = JSON.parse(jsonText)
      } catch (err) {
        console.error('[XAIProvider] Translation chunk failed:', err)
        translated = null
      }

      if (!translated || typeof translated !== 'object') {
        console.error('[XAIProvider] Invalid translation for chunk:', i / batchSize)
        continue
      }

      for (const { key } of chunk) {
        const val = translated[key]
        if (typeof val === 'string' && val.trim().length > 0) {
          result[key] = val
        } else {
          console.warn('[XAIProvider] Missing translated value for key:', key)
        }
      }
    }

    return result
  }
}

export default new XAIProvider()
