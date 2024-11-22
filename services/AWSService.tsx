import { s3 } from '@/libs/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';


export default class AWSService {

    static allowedFolders = ['general', 'categories', 'users', 'posts', 'comments', 'images', 'videos', 'audios', 'files'];

    static uploadFile = async (file: File, folder?: string) : Promise<string | undefined> => {
        try {
            if (!file) {
                throw new Error("No file provided");
            } 

            if (!folder) {
                folder = 'general';
            }

            if (!AWSService.allowedFolders.includes(folder)) {
                throw new Error("Invalid folder name");
            }


            const timestamp = new Date().getTime();
            const fileBuffer = await file.arrayBuffer();
            const fileKey = `${folder}/${timestamp}-${file.name.replace(/ /g, "_")}`;
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key:  fileKey,
                Body: new Uint8Array(fileBuffer),
            });

            const response = await s3.send(command);

            const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

            return publicUrl;
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    }

    static uploadFromUrl = async (url: string, folder?: string) : Promise<string | undefined> => {
        try {
            const response = await fetch(url);
            const fileBuffer = await response.arrayBuffer();
            const timestamp = new Date().getTime();

            const beforeQuestionMark = url.split('?')[0];

            if (!folder) {
                folder = 'general';
            }

            if (!AWSService.allowedFolders.includes(folder)) {
                throw new Error("Invalid folder name");
            }

            const fileKey = `${folder}/${timestamp}-${beforeQuestionMark.split('/').pop()}`;           


            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key:  fileKey,
                Body: new Uint8Array(fileBuffer),
            });
            
            const uploadResponse = await s3.send(command);

            const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

            return publicUrl;
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    }
}