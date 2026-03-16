import { NextResponse } from 'next/server'
import { AIService } from '@/services/AIServices'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { GPT4oRequestSchema } from '@/dtos/AIAndServicesDTO'
import AIMessages from '@/messages/AIMessages'

export async function POST(request: NextRequest) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({ request })
    const body = await request.json()

    const parsedData = GPT4oRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const { prompt, model, provider } = parsedData.data
    AIService.assertPromptSafe(prompt)

    const requesterIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    await AIService.enforceUsageLimit(user?.userId ?? requesterIp)

    const providerService = AIService.getProvider(provider)
    AIService.assertSupportedModel(providerService, model)

    const text = await providerService.generateText(prompt, model)

    if (text === null) {
      return NextResponse.json({ message: AIMessages.GENERATION_FAILED }, { status: 422 })
    }

    return NextResponse.json({ message: AIMessages.TEXT_GENERATED_SUCCESSFULLY, text })
  } catch (error: any) {
    console.error('Error in AI generate route:', error)

    const message = error?.message || AIMessages.GENERATION_FAILED

    if (message === AIMessages.RATE_LIMIT_EXCEEDED) {
      return NextResponse.json({ message }, { status: 429 })
    }

    if (
      message === AIMessages.PROMPT_REQUIRED ||
      message === AIMessages.PROMPT_TOO_LONG ||
      message === AIMessages.PROMPT_INJECTION_DETECTED ||
      message === AIMessages.UNSUPPORTED_PROVIDER ||
      message === AIMessages.MODEL_NOT_AVAILABLE
    ) {
      return NextResponse.json({ message }, { status: 400 })
    }

    return NextResponse.json(
      { message },
      { status: 500 }
    )
  }
}
