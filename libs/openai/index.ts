import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('[OpenAI] OPENAI_API_KEY is not set. AI features will be unavailable.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  // Bound a stalled call: the SDK defaults to a 10-minute timeout with 2 retries,
  // which can hang a chat request for minutes. Fail fast instead.
  timeout: 60_000,
  maxRetries: 1,
})

export default openai
