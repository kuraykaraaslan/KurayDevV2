import openai from '@/libs/openai';
import { Post } from '@/types/content/BlogTypes';
import { ImageGenerateParams } from 'openai/resources/images.mjs';


export default class OpenAIService {

    static async generateImage(prompt: string, width: number = 1792, height: number = 1024): Promise<string | null> {

        const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];

        if (!validSizes.includes(`${width}x${height}`)) {
            throw new Error('Invalid image size. Allowed sizes are 256x256, 512x512, 1024x1024, 1792x1024, 1024x1792.');
        }

        try {
            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: `${width}x${height}` as ImageGenerateParams['size'],
                response_format: 'url',
            });

            if (!response.data || response.data.length === 0) {
                return null;
            }

            const imageUrl = response.data[0].url;

            return imageUrl || null;

        } catch (error) {
            console.error('Error generating image:', error);
        }

        return null;
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
                max_tokens: 1000,
            });

            let text = response.choices[0].message.content;

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


    /**
     * Translates specific fields from one language to another
     * @param content - Object containing fields to translate
     * @param fields - Array of field names to translate
     * @param sourceLang - Source language code
     * @param targetLang - Target language code
     * @returns Translated fields as JSON object
     */
    static async translateFields(
        content: Record<string, string | string[] | undefined>,
        fields: string[],
        sourceLang: string,
        targetLang: string
    ): Promise<Record<string, string | string[]> | null> {

        // Build content to translate
        const fieldsToTranslate: Record<string, string> = {};
        for (const field of fields) {
            const value = content[field];
            if (value !== undefined && value !== null) {
                fieldsToTranslate[field] = Array.isArray(value) ? value.join(', ') : value;
            }
        }

        if (Object.keys(fieldsToTranslate).length === 0) {
            return null;
        }

        // Build example JSON based on fields
        const exampleJson: Record<string, string | string[]> = {};
        for (const field of fields) {
            if (field === 'keywords') {
                exampleJson[field] = ['keyword1', 'keyword2'];
            } else {
                exampleJson[field] = `Translated ${field}`;
            }
        }

        const prompt = `Translate the following content from ${sourceLang} to ${targetLang}.
            Provide the translation in JSON format with ONLY the following fields: ${fields.join(', ')}.
            Ensure the translation is accurate, contextually relevant, and maintains the original formatting (especially for HTML content).
            For slug field, use lowercase letters, numbers, and hyphens only.

            Expected JSON format:
            ${JSON.stringify(exampleJson, null, 2)}

            Content to translate:
            ${Object.entries(fieldsToTranslate).map(([key, val]) => `${key}: ${val}`).join('\n')}
            `;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional translator. Always respond with valid JSON only, no additional text.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 12000,
                response_format: { type: 'json_object' },
            });

            const text = response.choices[0].message.content;

            if (!text) {
                return null;
            }

            const result = JSON.parse(text);

            // Ensure keywords is an array
            if (result.keywords && typeof result.keywords === 'string') {
                result.keywords = result.keywords.split(',').map((k: string) => k.trim());
            }

            return result;
        } catch (error) {
            console.error('Error translating fields:', error);
            return null;
        }
    }
}
