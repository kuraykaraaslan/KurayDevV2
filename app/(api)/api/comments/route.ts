import { NextResponse } from "next/server";
import UserSessionService from '@/services/AuthService/UserSessionService';
import CommentService from '@/services/CommentService';
import PostService from '@/services/PostService';
import { pipeline, env } from "@xenova/transformers";
import { CommentStatus } from '@prisma/client';

// Bu route kesin Node.js runtime'da çalışsın:
export const runtime = 'nodejs';

// İstersen (zorunlu değil) model cache path'i ayarlayabilirsin
// env.localModelPath = '/tmp/models'; // Vercel için uygun

let toxicityModel: any = null;

async function loadToxicityModel() {
  if (!toxicityModel) {
    toxicityModel = await pipeline(
      "text-classification",
      "Xenova/toxic-bert" // 🔴 BURASI ÖNEMLİ
    );
  }
  return toxicityModel;
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate user session
        await UserSessionService.authenticateUserByRequest(request, "GUEST");

        // Determine role (ADMIN, USER, or fallback GUEST)
        const userRole = request.user?.role || "GUEST";

        const { content, postId, parentId, email, name } = await request.json();

        if (!name || !email || !content) {
            return NextResponse.json(
                { message: "Please fill in the required fields." },
                { status: 400 }
            );
        }

        // Validate post
        const post = await PostService.getPostById(postId);

        if (!post) {
            return NextResponse.json(
                { message: "Post not found." },
                { status: 404 }
            );
        }

        let finalStatus: CommentStatus = CommentStatus.NOT_PUBLISHED;

        if (userRole === "ADMIN") {
            finalStatus = CommentStatus.PUBLISHED;
        } else {
            try {
                const model = await loadToxicityModel();
                if (!model) {
                    console.warn("⚠ Toxicity model could not be loaded. Fallback => NOT_PUBLISHED");
                    finalStatus = CommentStatus.NOT_PUBLISHED;
                } else {
                    const result = await model(content);
                    const toxicScore = result[0].score;

                    const isSafe = toxicScore < 0.45;
                    finalStatus = isSafe ? CommentStatus.PUBLISHED : CommentStatus.SPAM;

                    console.log("Toxicity score:", toxicScore, "=>", finalStatus);
                }
            } catch (err) {
                console.error("⚠ AI moderation failed:", err);
                finalStatus = CommentStatus.NOT_PUBLISHED;
            }
        }

        await CommentService.createComment({
            content,
            postId,
            parentId,
            email,
            name,
            status: finalStatus,
            createdAt: new Date(),
        });

        return NextResponse.json(
            {
                message: "Comment created.",
                status: finalStatus,
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const postId = searchParams.get('postId') || undefined;
        const search = searchParams.get('search') || undefined;
        const pending = searchParams.get('pending') === 'true';

        if (pending) {
            await UserSessionService.authenticateUserByRequest(request, "ADMIN");
        } else {
            await UserSessionService.authenticateUserByRequest(request, "GUEST");
        }



        const data = {
            page,
            pageSize,
            search,
            postId,
            pending
        }

        const result = await CommentService.getAllComments(data);
        return NextResponse.json({ comments: result.comments, total: result.total, page, pageSize });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, _response: NextResponse) {

    try {
        await UserSessionService.authenticateUserByRequest(request, "ADMIN");

        const data = await request.json();
        await CommentService.updateComment(data);

        return NextResponse.json({ message: "Comment updated successfully." });


    } catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }

}
