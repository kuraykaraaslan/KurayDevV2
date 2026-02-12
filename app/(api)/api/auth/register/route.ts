// Original path: app/api/auth/register/route.ts

import { NextResponse } from 'next/server'
import RateLimiter from '@/libs/rateLimit'
import AuthService from '@/services/AuthService'
import { RegisterRequestSchema } from '@/dtos/AuthDTO'
import AuthMessages from '@/messages/AuthMessages'

export async function POST(request: NextRequest) {
  try {
    await RateLimiter.checkRateLimit(request)

    const parsedData = RegisterRequestSchema.safeParse(await request.json())

    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const { name, email, password, phone } = parsedData.data

    const user = await AuthService.register({
      name,
      email,
      password,
      phone,
    })

    if (!user) {
      return NextResponse.json({ error: AuthMessages.REGISTRATION_FAILED }, { status: 400 })
    }

    return NextResponse.json({ message: AuthMessages.REGISTRATION_SUCCESSFUL }, { status: 201 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
