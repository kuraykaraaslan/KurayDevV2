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

            return imageUrl || null;

        } catch (error) {
            console.error('Error generating image:', error);
        }

        return null;
    }

    static async generateText(prompt: string) : Promise<string | JSON | null> {
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
                max_tokens: 1000,
            });

            var text = response.choices[0].message.content;

            if (!text) {
                return null;
            }

            //try to parse the text if it is a json
            try {
                text = JSON.parse(text);
            } catch (error) {
                //do nothing
            }

            return text || null;

        } catch (error) {
            console.error('Error generating text:', error);
        }

        return null;
    }

}
