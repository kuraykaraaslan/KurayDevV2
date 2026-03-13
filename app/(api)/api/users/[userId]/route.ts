import { NextResponse } from 'next/server'
import UserService from '@/services/UserService'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { UpdateUserRequestSchema } from '@/dtos/UserDTO'
import UserMessages from '@/messages/UserMessages'
import UserProfileService from '@/services/UserService/UserProfileService'
import type { UserProfile } from '@/types/user/UserProfileTypes'

/**
 * GET handler for retrieving a user by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including userId
 * @returns A NextResponse containing the user data or an error message
 */
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = await params

    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'USER' })

    const user = await UserService.getById(userId)

    if (!user) {
      return NextResponse.json({ message: 'USER_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * DELETE handler for deleting a user by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including userId
 * @returns A NextResponse containing a success message or an error message
 */
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { userId } = await params

    const user = await UserService.getById(userId)

    if (!user) {
      return NextResponse.json({ message: UserMessages.USER_NOT_FOUND }, { status: 404 })
    }

    await UserService.delete(userId)

    return NextResponse.json({ message: UserMessages.USER_DELETED_SUCCESSFULLY })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * PUT handler for updating a user by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including userId
 * @returns A NextResponse containing the updated user data or an error message
 */
export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { userId } = await params

    const data = await request.json()

    const parsedData = UpdateUserRequestSchema.safeParse(data)

    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    if (parsedData.data.userId !== userId) {
      return NextResponse.json({ message: UserMessages.INVALID_USER_ID }, { status: 400 })
    }

    const { userId: _bodyUserId, name, image, ...userPatch } = parsedData.data

    const profilePatch: Partial<UserProfile> = {}
    if (name !== undefined) profilePatch.name = name
    if (image !== undefined) profilePatch.profilePicture = image

    if (Object.keys(profilePatch).length > 0) {
      await UserProfileService.updateProfile({ userId, data: profilePatch })
    }

    const hasUserUpdates = Object.values(userPatch).some((v) => v !== undefined)
    if (hasUserUpdates) {
      await UserService.update({ userId, data: userPatch })
    }

    const updatedUser = await UserService.getById(userId)

    return NextResponse.json({ user: updatedUser })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === UserMessages.USERNAME_TAKEN) {
      return NextResponse.json({ message: UserMessages.USERNAME_TAKEN }, { status: 409 })
    }

    if (message === UserMessages.INVALID_USERNAME) {
      return NextResponse.json({ message: UserMessages.INVALID_USERNAME }, { status: 400 })
    }

    return NextResponse.json({ message }, { status: 500 })
  }
}
