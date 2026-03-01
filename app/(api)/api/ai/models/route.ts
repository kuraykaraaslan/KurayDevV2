import { NextResponse } from 'next/server'
import { AIService } from '@/services/AIServices'
import UserSessionService from '@/services/AuthService/UserSessionService'
import AIMessages from '@/messages/AIMessages'

export async function GET(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({ request })

    const allProviders = AIService.getAllProviders()
    const results = await Promise.allSettled(allProviders.map((p) => p.getModels()))

    const models = results.flatMap((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[GET /api/ai/models] ${allProviders[i].provider} failed:`, result.reason)
        return []
      }
      return result.value
    })

    return NextResponse.json({ models })
  } catch (error: any) {
    console.error('[GET /api/ai/models]', error)
    return NextResponse.json(
      { message: error.message || AIMessages.API_ERROR },
      { status: 500 }
    )
  }
}
