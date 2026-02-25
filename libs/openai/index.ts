import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('[OpenAI] OPENAI_API_KEY is not set. AI features will be unavailable.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export default openai
