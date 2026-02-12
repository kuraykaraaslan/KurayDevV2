import { NextResponse } from 'next/server'
import OpenAIService from '@/services/OpenAIService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { GPT4oRequestSchema } from '@/dtos/AIAndServicesDTO'
import AIMessages from '@/messages/AIMessages'

/**
 * POST handler for creating a new post.
 * @param request - The incoming request object
 * @returns A NextResponse containing the new post data or an error message
 */
export async function POST(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({ request })
    const body = await request.json()

    const parsedData = GPT4oRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const { prompt } = parsedData.data
    const text = await OpenAIService.generateText(prompt)
    return NextResponse.json({ message: AIMessages.TEXT_GENERATED_SUCCESSFULLY, text })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || AIMessages.GENERATION_FAILED },
      { status: 500 }
    )
  }
}
