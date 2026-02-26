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

  static async translateMultipleKeys(
    items: { key: string; text: string }[],
    targetLanguage: string,
    sourceLanguage: string = "en",
    opts?: {
      batchSize?: number;
      model?: string;
    }
  ): Promise<Record<string, string>> {
    const batchSize = opts?.batchSize ?? 40;
    const model = opts?.model ?? "gpt-4o";

    if (!items?.length) return {};

    // filter invalids
    const clean = items.filter(
      (x) => x && typeof x.key === "string" && typeof x.text === "string" && x.text.trim().length > 0
    );
    if (!clean.length) return {};

    const result: Record<string, string> = {};

    // chunking
    for (let i = 0; i < clean.length; i += batchSize) {
      const chunk = clean.slice(i, i + batchSize);

      const payload = chunk.reduce((acc, cur) => {
        acc[cur.key] = cur.text;
        return acc;
      }, {} as Record<string, string>);

      const prompt = [
        `Translate the VALUES of the following JSON object from ${sourceLanguage} to ${targetLanguage}.`,
        `- Do NOT translate the keys.`,
        `- Return ONLY valid JSON.`,
        `- Keep placeholders like {name}, {{count}}, %s, and HTML tags unchanged.`,
        `- Use natural ${targetLanguage} suitable for a UI.`,
        ``,
        `JSON to translate:`,
        JSON.stringify(payload, null, 2),
      ].join("\n");

      let translated: any = null;

      try {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("Missing OPENAI_API_KEY env var.");
        }

        const response = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a translation engine. You ONLY output strict JSON. Never output markdown or extra text.",
            },
            { role: "user", content: prompt },
          ],
          // IMPORTANT: keep deterministic-ish
          temperature: 0.2,
          max_tokens: 4000,
        });

        const content = response.choices?.[0]?.message?.content?.trim();
        if (!content) throw new Error("Empty translation response.");

        // Strict JSON parse (also handle accidental code fences)
        const jsonText = content
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/i, "")
          .trim();

        translated = JSON.parse(jsonText);
      } catch (err) {
        console.error("Translation chunk failed:", err);
        translated = null;
      }

      if (!translated || typeof translated !== "object") {
        console.error("Translation is not a valid JSON object for chunk:", i / batchSize);
        continue;
      }

      // @ts-ignore
      for (const { key, text } of chunk) {
        const val = translated[key];

        if (typeof val === "string" && val.trim().length > 0) {
          result[key] = val;
        } else {
          // If model missed this key, do not silently keep English
          console.warn("Missing translated value for key:", key);
          // optional: you could fallback to English here, but that causes your original issue.
          // result[key] = text;
        }
      }
    }

    return result;
  }
}