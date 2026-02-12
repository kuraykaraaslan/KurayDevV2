import { NextRequest, NextResponse } from 'next/server'
import GithubService from '@/services/IntegrationService/GithubService'
import { GetGithubContributionsRequestSchema } from '@/dtos/SectionsDTO'

export async function GET(_request: NextRequest) {
  try {
    const parsedData = GetGithubContributionsRequestSchema.safeParse({})

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const data = await GithubService.getContributionCalendar()
    return NextResponse.json(
      {
        message: 'GitHub contributions retrieved successfully',
        data: data,
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        message: 'Error retrieving GitHub contributions',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
