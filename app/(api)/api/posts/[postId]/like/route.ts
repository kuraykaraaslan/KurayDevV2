import { NextResponse } from 'next/server';
import PostLikeService from '@/services/PostService/LikeService';
import UserSessionService from '@/services/AuthService/UserSessionService';

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {

    await UserSessionService.authenticateUserByRequest(request, 'GUEST' );
    
    const { postId } = await params;
    const userId = request.user.userId; // Extract userId from the authenticated session
    
    // Call the likePost method with the postId and userId
    await PostLikeService.likePost({
      postId,
      userId,
      request, // Pass the request
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}