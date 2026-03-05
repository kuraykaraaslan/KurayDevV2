import { NextResponse } from 'next/server'
import { AIService } from '@/services/AIServices'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { GPT4oRequestSchema } from '@/dtos/AIAndServicesDTO'
import AIMessages from '@/messages/AIMessages'

export async function POST(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request })
    const body = await request.json()

    const parsedData = GPT4oRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const { prompt, model, provider } = parsedData.data
    const text = await AIService.getProvider(provider).generateText(prompt, model)

    if (text === null) {
      return NextResponse.json({ message: AIMessages.GENERATION_FAILED }, { status: 422 })
    }

    return NextResponse.json({ message: AIMessages.TEXT_GENERATED_SUCCESSFULLY, text })
  } catch (error: any) {
    console.error('Error in AI generate route:', error)
    return NextResponse.json(
      { message: error.message || AIMessages.GENERATION_FAILED },
      { status: 500 }
    )
  }
}
