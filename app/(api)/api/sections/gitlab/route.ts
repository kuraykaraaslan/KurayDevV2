import { NextResponse } from 'next/server'
import GitlabService from '@/services/IntegrationService/GitlabService'
import { GetGitlabContributionsRequestSchema } from '@/dtos/SectionsDTO'

export async function GET() {
  try {
    const parsedData = GetGitlabContributionsRequestSchema.safeParse({})

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const data = await GitlabService.getMockContributions()
    return NextResponse.json({
      message: 'GitLab contributions retrieved successfully',
      data,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        message: 'Error',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
