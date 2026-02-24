import openai from '@/libs/openai'
import { ImageGenerateParams } from 'openai/resources/images.mjs'

export default class OpenAIService {
  static async generateImage(
    prompt: string,
    width: number = 1792,
    height: number = 1024
  ): Promise<string | null> {
    const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']

    if (!validSizes.includes(`${width}x${height}`)) {
      throw new Error(
        'Invalid image size. Allowed sizes are 256x256, 512x512, 1024x1024, 1792x1024, 1024x1792.'
      )
    }

    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: `${width}x${height}` as ImageGenerateParams['size'],
        response_format: 'url',
      })

      if (!response.data || response.data.length === 0) {
        return null
      }

      const imageUrl = response.data[0].url

      return imageUrl || null
    } catch (error) {
      console.error('Error generating image:', error)
    }

    return null
  }

  static async generateText(prompt: string): Promise<string | JSON | null> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a Content Managment System API.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4000,
      })

      let text = response.choices[0].message.content

      if (!text) {
        return null
      }

      //try to parse the text if it is a json
      try {
        text = JSON.parse(text)
      } catch (error) {
        //do nothing
      }

      return text || null
    } catch (error) {
      console.error('Error generating text:', error)
    }

    return null
  }
}
