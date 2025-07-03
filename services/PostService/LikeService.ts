import prisma from '@/libs/prisma';
import UserAgentService from '@/services/UserAgentService';

export default class PostLikeService {


  /**
   * Add a like to a post.
   * Handles both authenticated (userId) and anonymous (ip + deviceFingerprint) likes.
   */
  static async likePost(params: {
    postId: string;
    userId?: string;
    request: NextRequest; // Optional request for generating device fingerprint
  }) {
    const { postId, userId } = params;

    const parsedUserAgent = await UserAgentService.parseRequest(params.request);
    const ipAddress = parsedUserAgent.ip;
    const deviceFingerprint = parsedUserAgent.deviceFingerprint;

    if (!postId || (!userId && (!ipAddress || !deviceFingerprint))) {
      throw new Error('Insufficient data to create a like.');
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        postId,
        OR: userId
          ? [{ userId }]
          : ipAddress && deviceFingerprint
            ? [{ ipAddress, deviceFingerprint }]
            : [],
      },
    });

    if (existingLike) {
      throw new Error('Post already liked.');
    }

    return await prisma.like.create({
      data: {
        postId,
        userId,
        ipAddress,
        deviceFingerprint,
      },
    });
  }

  /**
   * Remove a like from a post.
   * Works for both user and anonymous likes.
   */
  static async unlikePost(params: {
    postId: string;
    userId?: string;
    request: NextRequest; // Optional request for generating device fingerprint
  }) {
    const { postId, userId } = params;

    const parsedUserAgent = await UserAgentService.parseRequest(params.request);
    const ipAddress = parsedUserAgent.ip;
    const deviceFingerprint = parsedUserAgent.deviceFingerprint;

    if (!postId || (!userId && (!ipAddress || !deviceFingerprint))) {
      throw new Error('Insufficient data to remove like.');
    }

    const like = await prisma.like.findFirst({
      where: {
        postId,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(!userId && ipAddress && deviceFingerprint ? [{ ipAddress, deviceFingerprint }] : [])
        ],
      },
    });

    if (!like) {
      throw new Error('Like not found.');
    }

    await prisma.like.delete({
      where: {
        likeId: like.likeId, // Assuming likeId is the primary key
      },
    });
  }

  /**
   * Check if the post is liked by the given user or anonymous info.
   */
  static async isPostLiked(params: {
    postId: string;
    userId?: string;
    request: NextRequest; // Optional request for generating device fingerprint
  }): Promise<boolean> {
    const { postId, userId } = params;

    const parsedUserAgent = await UserAgentService.parseRequest(params.request);
    const ipAddress = parsedUserAgent.ip;
    const deviceFingerprint = parsedUserAgent.deviceFingerprint;

    const like = await prisma.like.findFirst({
      where: {
        postId,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(!userId && ipAddress && deviceFingerprint ? [{ ipAddress, deviceFingerprint }] : [])
        ],
      },
    });

    return !!like;
  }

  /**
   * Count total likes for a post
   */
  static async countLikes(postId: string): Promise<number> {
    return await prisma.like.count({
      where: { postId },
    });
  }
}
