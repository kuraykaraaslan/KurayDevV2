import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import TOTPService from '@/services/AuthService/TOTPService'
import SecurityService from '@/services/AuthService/SecurityService'
import AuthMessages from '@/messages/AuthMessages'
import { TOTPSetupRequestSchema } from '@/dtos/AuthDTO'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsedData = TOTPSetupRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const { user, userSession } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const { userSecurity } = await SecurityService.getUserSecurity(user.userId)
    if (userSecurity.otpMethods.includes('TOTP_APP' as any)) {
      return NextResponse.json({ message: 'TOTP already enabled' }, { status: 400 })
    }

    const { secret, otpauthUrl } = await TOTPService.requestSetup({ user, userSession })

    return NextResponse.json({ message: AuthMessages.TOTP_SETUP_INITIATED, secret, otpauthUrl })
  } catch (err: any) {
    console.error('TOTP Setup Error:', err)
    return NextResponse.json({ message: err.message || AuthMessages.INVALID_OTP }, { status: 400 })
  }
}
