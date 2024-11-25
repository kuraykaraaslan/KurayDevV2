'use server'

import { NextResponse } from 'next/server'
import NextRequest from '@/types/NextRequest'
import AWSService from '@/services/AWSService'
import AuthService from '@/services/AuthService'


/**
 * POST handler for uploading a file to an S3 bucket.
 * @param req - The incoming request object
 * @returns A NextResponse containing the S3 URL or an error message
 */
export async function POST(request: NextRequest) {
    try {

        //AuthService.authenticateSync(request, 'ADMIN');
        
        const formData = await request.formData();

        const file = formData.get('file');
        const folder = formData.get('folder');

        if (!file) {
            return NextResponse.json(
                { message: 'No file provided' },
                { status: 400 }
            );
        }

        const url = await AWSService.uploadFile(file as File, folder as string);

        return NextResponse.json({ url });

    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


