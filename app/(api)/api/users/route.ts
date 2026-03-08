import { NextResponse } from 'next/server'
import UserService from '@/services/UserService'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { CreateUserRequestSchema } from '@/dtos/UserDTO'

/**
 * GET handler for retrieving all users.
 * @param request - The incoming request object
 * @returns A NextResponse containing the user data or an error message
 */
export async function GET(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'USER' })

    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') || '0', 10) : 0
    const pageSize = searchParams.get('pageSize')
      ? parseInt(searchParams.get('pageSize') || '10', 10)
      : 10
    const search = searchParams.get('search') || undefined
    const sortKey = searchParams.get('sortKey') || undefined
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    const { users, total } = await UserService.getAll({
      page,
      pageSize,
      search,
      sortKey,
      sortDir,
    })

    if (request?.user?.userRole !== 'ADMIN') {
      //omit user data only id and name
      users.forEach((user: any) => {
        delete user.email
        delete user.password
        delete user.userRole
        delete user.image
        delete user.phone
      })
    }

    return NextResponse.json({ users, total, page, pageSize })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * POST handler for creating a new user.
 * @param request - The incoming request object
 * @returns A NextResponse containing the new user data or an error message
 */
export async function POST(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const body = await request.json()

    const parsedData = CreateUserRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const { email, password, name, phone, userRole } = parsedData.data

    const user = await UserService.create({
      email,
      password,
      name,
      phone,
      userRole,
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
