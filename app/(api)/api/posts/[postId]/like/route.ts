import { NextResponse } from 'next/server';
import PostLikeService from '@/services/PostService/LikeService';
import UserSessionService from '@/services/AuthService/UserSessionService';
import PostMessages from '@/messages/PostMessages';

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {

    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "GUEST" });
    
    const { postId } = await params;
    const userId = request?.user?.userId || null;
    
    // Call the likePost method with the postId and userId
    await PostLikeService.likePost({
      postId,
      userId,
      request, // Pass the request
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error liking post:', error);
    return NextResponse.json({ success: false, error: PostMessages.OPERATION_FAILED }, { status: 400 });
  }
}