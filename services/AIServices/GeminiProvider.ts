import redisInstance from '@/libs/redis'
import { AIMmodelOption, serializeAIModel } from '@/types/features/AITypes'
import { AIBaseProvider, ChatMsg } from './AIBaseProvider'

const MODELS_CACHE_KEY = 'ai:gemini:models'
const MODELS_CACHE_TTL = 3600 // 1 hour

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

function apiKey(): string {
  const key = process.env.GOOGLE_API_KEY
  if (!key) throw new Error('[GeminiProvider] GOOGLE_API_KEY is not set.')
  return key
}

export class GeminiProvider extends AIBaseProvider {
  readonly provider = 'GOOGLE_GENAI' as const

  async getModels(): Promise<AIMmodelOption[]> {
    const cached = await redisInstance.get(MODELS_CACHE_KEY)
    if (cached) return JSON.parse(cached) as AIMmodelOption[]

    const res = await fetch(`${BASE_URL}/models?key=${apiKey()}`)
    if (!res.ok) throw new Error(`[GeminiProvider] Failed to fetch models: ${res.status}`)

    const data = await res.json() as {
      models: {
        name: string
        displayName: string
        supportedGenerationMethods: string[]
      }[]
    }

    const models: AIMmodelOption[] = data.models
      .filter((m) => m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => {
        // "models/gemini-2.0-flash" → "gemini-2.0-flash"
        const modelName = m.name.replace(/^models\//, '')
        return {
          id: serializeAIModel('GOOGLE_GENAI', modelName),
          label: m.displayName,
          provider: 'GOOGLE_GENAI' as const,
          modelName,
        }
      })

    await redisInstance.set(MODELS_CACHE_KEY, JSON.stringify(models), 'EX', MODELS_CACHE_TTL)

    return models
  }

  async generateText(prompt: string, model: string = 'gemini-2.0-flash'): Promise<string | null> {
    const res = await fetch(
      `${BASE_URL}/models/${model}:generateContent?key=${apiKey()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'You are a Content Management System API.' }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000 },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`[GeminiProvider] generateText failed (${res.status}): ${err}`)
    }

    const data = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    if (!text) return null

    try { return JSON.parse(text) } catch { return text }
  }

  async *streamText(prompt: string, model: string = 'gemini-2.0-flash'): AsyncGenerator<string, void, unknown> {
    const res = await fetch(
      `${BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'You are a Content Management System API.' }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000 },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`[GeminiProvider] streamText failed (${res.status}): ${err}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('[GeminiProvider] No readable stream')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue

        try {
          const parsed = JSON.parse(raw) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[]
          }
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
        } catch { /* skip malformed JSON */ }
      }
    }
  }

  async *streamMessages(messages: ChatMsg[], model: string = 'gemini-2.0-flash'): AsyncGenerator<string, void, unknown> {
    const systemMsg = messages.find((m) => m.role === 'system')
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

    const res = await fetch(
      `${BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg.content }] } } : {}),
          contents,
          generationConfig: { maxOutputTokens: 4000 },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`[GeminiProvider] streamMessages failed (${res.status}): ${err}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('[GeminiProvider] No readable stream')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue

        try {
          const parsed = JSON.parse(raw) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[]
          }
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
        } catch { /* skip malformed JSON */ }
      }
    }
  }

  async translateMultipleKeys(
    items: { key: string; text: string }[],
    targetLanguage: string,
    sourceLanguage: string = 'en',
    opts?: { batchSize?: number; model?: string }
  ): Promise<Record<string, string>> {
    const batchSize = opts?.batchSize ?? 40
    const model = opts?.model ?? 'gemini-2.0-flash'

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
        const res = await fetch(
          `${BASE_URL}/models/${model}:generateContent?key=${apiKey()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: 'You are a translation engine. You ONLY output strict JSON. Never output markdown or extra text.' }],
              },
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 4000, temperature: 0.2 },
            }),
          }
        )

        if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)

        const data = await res.json() as {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
        }

        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (!content) throw new Error('Empty translation response.')

        const jsonText = content
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim()

        translated = JSON.parse(jsonText)
      } catch (err) {
        console.error('[GeminiProvider] Translation chunk failed:', err)
        translated = null
      }

      if (!translated || typeof translated !== 'object') {
        console.error('[GeminiProvider] Invalid translation for chunk:', i / batchSize)
        continue
      }

      for (const { key } of chunk) {
        const val = translated[key]
        if (typeof val === 'string' && val.trim().length > 0) {
          result[key] = val
        } else {
          console.warn('[GeminiProvider] Missing translated value for key:', key)
        }
      }
    }

    return result
  }
}

export default new GeminiProvider()
