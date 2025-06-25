import redis from "@/libs/redis";
import prisma from "@/libs/prisma";

export default class StatService {
  static REDIS_KEY = "stats:global";
  static CACHE_TTL_SECONDS = 320; // 5 dakika

  /**
   * Get all stats with Redis caching
   * @returns Cached or fresh stats
   */
  static async getAllStats() {
    // Önce Redis’te var mı kontrol et
    const cached = await redis.get(this.REDIS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    // Yoksa veritabanından al
    const [
      totalPosts,
      totalCategories,
      totalUsers,
      totalViewsAggregate,
      totalComments
    ] = await prisma.$transaction([
      prisma.post.count(),
      prisma.category.count(),
      prisma.user.count(),
      prisma.post.aggregate({ _sum: { views: true } }),
      prisma.comment.count()
    ]);

    const stats = {
      totalPosts,
      totalCategories,
      totalUsers,
      totalViews: totalViewsAggregate._sum.views || 0,
      totalComments
    };

    // Redis’e yaz
    await redis.set(this.REDIS_KEY, JSON.stringify(stats), "EX", this.CACHE_TTL_SECONDS);

    return stats;
  }
}
