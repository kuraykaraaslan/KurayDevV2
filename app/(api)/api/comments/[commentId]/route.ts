import { NextResponse } from "next/server";
import UserSessionService from '@/services/AuthService/UserSessionService';
import CommentService from '@/services/CommentService';
import CommentMessages from '@/messages/CommentMessages';

export async function DELETE(request: NextRequest, { params }: { params: { commentId: string } }) {
    try {
        // Authenticate user session
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

        const { commentId } = await params;

        // Delete comment
        const deleted = await CommentService.deleteComment(commentId);

        if (!deleted) {
            return NextResponse.json(
                { message: CommentMessages.COMMENT_NOT_FOUND },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: CommentMessages.COMMENT_DELETED_SUCCESSFULLY },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 }
        );
    }
}