import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import TOTPService from '@/services/AuthService/TOTPService'
import AuthMessages from '@/messages/AuthMessages'
import { TOTPEnableRequestSchema } from '@/dtos/AuthDTO'

export async function POST(request: NextRequest) {
  try {
    const { user, userSession } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const body = await request.json()

    const parsedData = TOTPEnableRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const { otpToken } = parsedData.data

    const result = await TOTPService.verifyAndEnable({ user, userSession, otpToken })

    return NextResponse.json({
      success: true,
      message: AuthMessages.TOTP_ENABLED_SUCCESSFULLY,
      backupCodes: result.backupCodes,
    })
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || AuthMessages.TOTP_ENABLE_FAILED },
      { status: 500 }
    )
  }
}
