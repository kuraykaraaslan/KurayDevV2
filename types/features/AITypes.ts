import { z } from 'zod'

export const AIMProvider = z.enum(['OPENAI', 'AZURE_OPENAI', 'GOOGLE_GENAI', 'ANTHROPIC', 'DEEPSEEK', 'XAI', 'CUSTOM'])

export type AIMProviderType = z.infer<typeof AIMProvider>

export const AIMmodelOption = z.object({
    id: z.string().optional(), // optional because it can be derived from provider + modelName
    provider: AIMProvider,
    modelName: z.string(),
    label: z.string().optional(),
})

export type AIMmodelOption = z.infer<typeof AIMmodelOption>

/** Serialize to dropdown value string */
export const serializeAIModel = (provider: AIMProviderType, modelName: string): string =>
    `${provider}:${modelName}`

/** Deserialize dropdown value string → AIMmodelOption (null if invalid) */
export const deserializeAIModel = (id: string): AIMmodelOption | null => {
    const colonIdx = id.indexOf(':')
    if (colonIdx === -1) return null
    const provider = id.slice(0, colonIdx)
    const modelName = id.slice(colonIdx + 1)
    const parsed = AIMmodelOption.safeParse({ provider, modelName })
    return parsed.success ? parsed.data : null
}
