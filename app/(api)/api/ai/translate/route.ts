import { NextResponse } from "next/server";
import OpenAIService from "@/services/OpenAIService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import { z } from "zod";

const TranslateRequestSchema = z.object({
    content: z.record(z.string(), z.union([z.string(), z.array(z.string())]).optional()),
    fields: z.array(z.string()).min(1),
    sourceLang: z.string().min(2).max(5),
    targetLang: z.string().min(2).max(5),
});

/**
 * POST handler for translating content fields
 * @param request - The incoming request object
 * @returns A NextResponse containing the translated content or an error message
 */
export async function POST(request: NextRequest) {
    try {
        await UserSessionService.authenticateUserByRequest({ request });
        const body = await request.json();

        const parsedData = TranslateRequestSchema.safeParse(body);

        if (!parsedData.success) {
            return NextResponse.json({
                message: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        const { content, fields, sourceLang, targetLang } = parsedData.data;

        if (sourceLang === targetLang) {
            return NextResponse.json({
                message: "Source and target languages must be different"
            }, { status: 400 });
        }

        const translatedContent = await OpenAIService.translateFields(
            content,
            fields,
            sourceLang,
            targetLang
        );

        if (!translatedContent) {
            return NextResponse.json({
                message: "Translation failed. Please try again."
            }, { status: 500 });
        }

        return NextResponse.json({
            message: "Translation successful",
            translated: translatedContent
        });
    } catch (error: any) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { message: error.message || "Translation failed" },
            { status: 500 }
        );
    }
}
