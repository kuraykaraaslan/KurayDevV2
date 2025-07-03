import { NextRequest, NextResponse } from 'next/server';
import PostLikeService from '@/services/PostService/LikeService';

export async function GET(_: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const { postId } = await params;
    const total = await PostLikeService.countLikes(postId);
    return NextResponse.json({ success: true, total });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
