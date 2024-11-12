import openai from '@/libs/openai';

export default class OpenAIService {

    static async generateImage(prompt: string, width: number = 1200, height: number = 630) : Promise<string | null> {
        try {
            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,

                size: '1792x1024',
                response_format: 'url',
            });

            const imageUrl = response.data[0].url;
            console.log('Generated Image URL:', imageUrl);

            return imageUrl || null;

        } catch (error) {
            console.error('Error generating image:', error);
        }

        return null;
    }

}
