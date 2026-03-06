import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import SecurityService from '@/services/AuthService/SecurityService'
import AuthMessages from '@/messages/AuthMessages'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const { user } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const { userSecurity } = await SecurityService.getUserSecurity(user.userId)

    return NextResponse.json({
      message: AuthMessages.SECURITY_SETTINGS_RETRIEVED,
      userSecurity,
    })
  } catch (err: any) {
    console.error('Get Security Error:', err)

    return NextResponse.json(
      {
        message: err.message || AuthMessages.SECURITY_SETTINGS_RETRIEVED,
      },
      { status: 500 }
    )
  }
}
