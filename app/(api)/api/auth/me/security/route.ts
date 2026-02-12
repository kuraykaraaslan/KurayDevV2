import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import AuthService from '@/services/AuthService'
import AuthMessages from '@/messages/AuthMessages'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const { userSecurity } = await AuthService.getUserSecurity(user.userId)

    console.log('User Security:', userSecurity)

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
