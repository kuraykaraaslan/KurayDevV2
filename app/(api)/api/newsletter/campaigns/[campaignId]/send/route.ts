import { NextResponse } from 'next/server'
import CampaignService from '@/services/CampaignService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import CampaignMessages from '@/messages/CampaignMessages'

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { campaignId } = await params
    const result = await CampaignService.sendCampaign(campaignId)

    return NextResponse.json({
      message: CampaignMessages.CAMPAIGN_SENT_SUCCESSFULLY,
      sentCount: result.sentCount,
    })
  } catch (error: any) {
    const status = error.message === CampaignMessages.CAMPAIGN_NOT_FOUND ? 404 : 500
    return NextResponse.json({ message: error.message }, { status })
  }
}
