import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import AWSService from '@/services/StorageService/AWSService'
import { prisma } from '@/libs/prisma'

/**
 * POST /api/media/sync
 * Scans all files in S3 and inserts any that are not yet tracked in the DB.
 * Safe to run multiple times — already-tracked files are skipped (upsert by key).
 */
export async function POST(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    // Fetch every file from S3 (no folder filter — get everything)
    const s3Files = await AWSService.listFiles()

    if (s3Files.length === 0) {
      return NextResponse.json({ message: 'No files found in S3', created: 0, skipped: 0 })
    }

    let created = 0
    let skipped = 0

    for (const file of s3Files) {
      const existing = await prisma.media.findUnique({ where: { key: file.key } })

      if (existing) {
        skipped++
        continue
      }

      await prisma.media.create({
        data: {
          key: file.key,
          url: file.url,
          folder: file.folder,
          size: file.size,
          // mimeType, originalName and uploadedBy are unknown for legacy files
        },
      })

      created++
    }

    return NextResponse.json({
      message: `Sync complete. ${created} files imported, ${skipped} already tracked.`,
      created,
      skipped,
      total: s3Files.length,
    })
  } catch (error: any) {
    console.error('Error syncing media:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
