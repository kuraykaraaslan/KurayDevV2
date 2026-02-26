import { NextResponse } from 'next/server'
import CampaignService from '@/services/CampaignService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { CreateCampaignRequestSchema } from '@/dtos/CampaignDTO'
import CampaignMessages from '@/messages/CampaignMessages'

export async function GET(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const search = searchParams.get('search') || undefined

    const result = await CampaignService.getAllCampaigns({ page, pageSize, search })

    return NextResponse.json({
      campaigns: result.campaigns,
      total: result.total,
      page,
      pageSize,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const body = await request.json()

    const parsedData = CreateCampaignRequestSchema.safeParse(body)
    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const campaign = await CampaignService.createCampaign(parsedData.data)

    return NextResponse.json(
      { campaign, message: CampaignMessages.CAMPAIGN_CREATED_SUCCESSFULLY },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
