import { NextRequest, NextResponse } from 'next/server';
import PostLikeService from '@/services/PostService/LikeService';
import PostMessages from '@/messages/PostMessages';
import { GetLikeCountRequestSchema } from '@/dtos/PostInteractionDTO';

export async function GET(_: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const { postId } = await params;
    
    const parsedData = GetLikeCountRequestSchema.safeParse({ postId });
    
    if (!parsedData.success) {
      return NextResponse.json({
        
        message: parsedData.error.errors.map(err => err.message).join(", ")
      }, { status: 400 });
    }
    
    const total = await PostLikeService.countLikes(postId);
    return NextResponse.json({  message: PostMessages.LIKES_RETRIEVED, total });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || PostMessages.OPERATION_FAILED }, { status: 500 });
  }
}
