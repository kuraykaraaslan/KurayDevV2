import { NextRequest } from "next/server";
import { notFound } from "next/navigation";
import PostCoverService from "@/services/PostService/PostCoverService";
import PostService from "@/services/PostService";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const post = await PostService.getPostById(postId);

  if (!post) return notFound();

  const imageResponse = await PostCoverService.getImage(post);
  if (!imageResponse) return notFound();

  // ImageResponse zaten doğru header'ları içerdiğinden
  // ayrıca Response ile sarmalamaya gerek yok.
  return imageResponse;
}
