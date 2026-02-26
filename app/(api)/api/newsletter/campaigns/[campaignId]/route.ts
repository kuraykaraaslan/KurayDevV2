import { NextResponse } from 'next/server'
import CampaignService from '@/services/CampaignService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { UpdateCampaignRequestSchema } from '@/dtos/CampaignDTO'
import CampaignMessages from '@/messages/CampaignMessages'

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { campaignId } = await params
    const campaign = await CampaignService.getCampaignById(campaignId)

    if (!campaign) {
      return NextResponse.json({ message: CampaignMessages.CAMPAIGN_NOT_FOUND }, { status: 404 })
    }

    return NextResponse.json({ campaign })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { campaignId } = await params
    const body = await request.json()

    const parsedData = UpdateCampaignRequestSchema.safeParse({ ...body, campaignId })
    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const campaign = await CampaignService.updateCampaign(parsedData.data)

    return NextResponse.json({ campaign, message: CampaignMessages.CAMPAIGN_UPDATED_SUCCESSFULLY })
  } catch (error: any) {
    const status = error.message === CampaignMessages.CAMPAIGN_NOT_FOUND ? 404 : 500
    return NextResponse.json({ message: error.message }, { status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { campaignId } = await params
    await CampaignService.deleteCampaign(campaignId)

    return NextResponse.json({ message: CampaignMessages.CAMPAIGN_DELETED_SUCCESSFULLY })
  } catch (error: any) {
    const status = error.message === CampaignMessages.CAMPAIGN_NOT_FOUND ? 404 : 500
    return NextResponse.json({ message: error.message }, { status })
  }
}
