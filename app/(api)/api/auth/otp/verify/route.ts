import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import OTPService from '@/services/AuthService/OTPService'
import AuthMessages from '@/messages/AuthMessages'
import SecurityService from '@/services/AuthService/SecurityService'
import { OTPVerifyRequestSchema } from '@/dtos/AuthDTO'
import { OTPActionEnum } from '@/types/user/UserSecurityTypes'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { user, userSession } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const body = await request.json()

    const parsedData = OTPVerifyRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const { method, action, otpToken } = parsedData.data

    const { userSecurity } = await SecurityService.getUserSecurity(user.userId)

    const userOTPMethods = userSecurity.otpMethods

    await OTPService.verifyOTP({ user, userSession, method, action, otpToken })
    // Update user security settings based on action

    if (action === OTPActionEnum.Enum.enable && !userOTPMethods.includes(method)) {
      const updatedMethods = [...userOTPMethods, method]
      await SecurityService.updateUserSecurity(user.userId, { otpMethods: updatedMethods })
    }

    if (action === OTPActionEnum.Enum.disable && userOTPMethods.includes(method)) {
      const updatedMethods = userOTPMethods.filter((m) => m !== method)
      await SecurityService.updateUserSecurity(user.userId, { otpMethods: updatedMethods })
    }

    return NextResponse.json({ success: true, message: AuthMessages.OTP_VERIFIED_SUCCESSFULLY }, { status: 200 })
  } catch (err: any) {
    console.error('Verify OTP Error:', err)
    return NextResponse.json(
      {
        message: err.message || AuthMessages.OTP_VERIFICATION_FAILED,
      },
      { status: 500 }
    )
  }
}
