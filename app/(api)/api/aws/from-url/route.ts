'use server'

import { NextResponse, NextRequest } from 'next/server'
import AWSService from '@/services/AWSService'

/**
 * POST handler for uploading a file to an S3 bucket.
 * @param req - The incoming request object
 * @returns A NextResponse containing the S3 URL or an error message
 */
export async function POST(request: NextRequest) {
    try {

        const { url, folder } = await request.json();


        if (!url) {
            return NextResponse.json(
                { message: 'No URL provided' },
                { status: 400 }
            );
        }

        const urlReloaded = await AWSService.uploadFromUrl(url, folder);

        return NextResponse.json({ url: urlReloaded });

    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

