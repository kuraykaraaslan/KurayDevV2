//create a s3 client
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

//create a s3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

export const s3 = s3Client;

export default s3;