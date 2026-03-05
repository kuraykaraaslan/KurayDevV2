import openai from '@/libs/openai'
import redisInstance from '@/libs/redis'
import { AIMmodelOption, serializeAIModel } from '@/types/features/AITypes'
import { ImageGenerateParams } from 'openai/resources/images.mjs'
import { AIBaseProvider } from './AIBaseProvider'

const MODELS_CACHE_KEY = 'ai:openai:models:v3'
const MODELS_CACHE_TTL = 3600 // 1 hour

export class OpenAIProvider extends AIBaseProvider {
  readonly provider = 'OPENAI' as const

  async getModels(): Promise<AIMmodelOption[]> {
    const cached = await redisInstance.get(MODELS_CACHE_KEY)
    if (cached) {
      return JSON.parse(cached) as AIMmodelOption[]
    }

    const response = await openai.models.list()

    const models: AIMmodelOption[] = response.data
      .filter((m) => {
        const id = m.id.toLowerCase()
        // Only known chat model families — avoids newer non-chat gpt-* variants
        const isChatFamily =
          id.startsWith('gpt-4') ||
          id.startsWith('gpt-3.5-turbo') ||
          id.startsWith('gpt-5') ||
          /^o\d/.test(id)
        const isExcluded =
          id.includes('instruct') ||
          id.includes('embedding') ||
          id.includes('whisper') ||
          id.includes('tts') ||
          id.includes('dall-e') ||
          id.includes('realtime') ||
          id.includes('audio') ||
          id.includes('image') ||
          id.includes('moderation') ||
          id.includes('search') ||
          id.includes('transcribe')
        return isChatFamily && !isExcluded
      })
      .sort((a, b) => b.created - a.created)
      .map((m) => ({
        id: serializeAIModel('OPENAI', m.id),
        label: m.id.replace(/^gpt-/i, 'GPT-').replace(/^o(\d)/i, 'O$1'),
        provider: 'OPENAI' as const,
        modelName: m.id,
      }))

    await redisInstance.set(MODELS_CACHE_KEY, JSON.stringify(models), 'EX', MODELS_CACHE_TTL)

    return models
  }

  async generateText(prompt: string, model: string = 'gpt-4o'): Promise<string | null> {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a Content Management System API.' },
        { role: 'user', content: prompt },
      ],
      max_completion_tokens: 4000,
    })

    const text = response.choices[0].message.content
    if (!text) return null

    try { return JSON.parse(text) } catch { return text }
  }

  async *streamText(prompt: string, model: string = 'gpt-4o'): AsyncGenerator<string, void, unknown> {
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a Content Management System API.' },
        { role: 'user', content: prompt },
      ],
      max_completion_tokens: 4000,
      stream: true,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) yield delta
    }
  }

  async generateImage(
    prompt: string,
    width: number = 1792,
    height: number = 1024
  ): Promise<string | null> {
    const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']

    if (!validSizes.includes(`${width}x${height}`)) {
      throw new Error(
        'Invalid image size. Allowed sizes: 256x256, 512x512, 1024x1024, 1792x1024, 1024x1792.'
      )
    }

    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: `${width}x${height}` as ImageGenerateParams['size'],
        response_format: 'url',
      })

      return response.data?.[0]?.url ?? null
    } catch (error) {
      console.error('[OpenAIProvider] generateImage error:', error)
      return null
    }
  }

  async translateMultipleKeys(
    items: { key: string; text: string }[],
    targetLanguage: string,
    sourceLanguage: string = 'en',
    opts?: { batchSize?: number; model?: string }
  ): Promise<Record<string, string>> {
    const batchSize = opts?.batchSize ?? 40
    const model = opts?.model ?? 'gpt-4o'

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
        if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY env var.')

        const response = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a translation engine. You ONLY output strict JSON. Never output markdown or extra text.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_completion_tokens: 4000,
        })

        const content = response.choices?.[0]?.message?.content?.trim()
        if (!content) throw new Error('Empty translation response.')

        const jsonText = content
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim()

        translated = JSON.parse(jsonText)
      } catch (err) {
        console.error('[OpenAIProvider] Translation chunk failed:', err)
        translated = null
      }

      if (!translated || typeof translated !== 'object') {
        console.error('[OpenAIProvider] Invalid translation for chunk:', i / batchSize)
        continue
      }

      for (const { key } of chunk) {
        const val = translated[key]
        if (typeof val === 'string' && val.trim().length > 0) {
          result[key] = val
        } else {
          console.warn('[OpenAIProvider] Missing translated value for key:', key)
        }
      }
    }

    return result
  }
}

export default new OpenAIProvider()
