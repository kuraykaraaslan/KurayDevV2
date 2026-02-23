import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import UserProfileService from '@/services/UserService/UserProfileService'
import RateLimiter from '@/libs/rateLimit'
import { UpdateProfileRequestSchema } from '@/dtos/AuthDTO'
import AuthMessages from '@/messages/AuthMessages'
import UserMessages from '@/messages/UserMessages'

// NextRequest is declared globally in global.d.ts

export async function PUT(request: NextRequest) {
  try {
    await RateLimiter.checkRateLimit(request)
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'USER' })

    const userId = request.user?.userId

    if (!userId) {
      return NextResponse.json({ message: AuthMessages.USER_NOT_AUTHENTICATED }, { status: 401 })
    }

    const { userProfile } = await request.json()

    const parsedData = UpdateProfileRequestSchema.safeParse(userProfile)

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const updatedProfile = await UserProfileService.updateProfile({
      userId,
      data: parsedData.data,
    })

    return NextResponse.json(
      {
        message: AuthMessages.PROFILE_UPDATED_SUCCESSFULLY,
        userProfile: updatedProfile,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === UserMessages.USERNAME_TAKEN) {
      return NextResponse.json({ message: 'Bu kullanıcı adı zaten kullanımda.' }, { status: 409 })
    }
    if (error.message === UserMessages.INVALID_USERNAME) {
      return NextResponse.json(
        { message: 'Geçersiz kullanıcı adı. Sadece küçük harf, rakam ve _ kullanılabilir.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await RateLimiter.checkRateLimit(request)
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'USER' })

    const userId = request.user?.userId
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userProfile = await UserProfileService.getProfile(userId)

    return NextResponse.json({ userProfile }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 })
  }
}
