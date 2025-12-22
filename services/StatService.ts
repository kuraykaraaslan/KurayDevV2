import redis from "@/libs/redis";
import { prisma } from '@/libs/prisma';
import { Stat } from '@/types/common';

export default class StatService {
  static REDIS_KEY = "stats:global:";
  static CACHE_TTL_SECONDS = 320;

  /**
   * Get all stats with Redis caching
   * @returns Cached or fresh stats
   */
  static async getAllStats(frequency: string): Promise<Stat> {    

    const cached = await redis.get(this.REDIS_KEY + (frequency || "all-time"));
    
    if (cached) {
      return JSON.parse(cached);
    }

    const whereClause = frequency && frequency !== "all-time"
      ? {
          createdAt: {
            gte: (() => {
              const now = new Date();
              switch (frequency) {
                case "daily":
                  now.setDate(now.getDate() - 1);
                  break;
                case "weekly":
                  now.setDate(now.getDate() - 7);
                  break;
                case "monthly":
                  now.setMonth(now.getMonth() - 1);
                  break;
                case "yearly":
                  now.setFullYear(now.getFullYear() - 1);
                  break;
                default:
                  break;
              }
              return now;
            })(),
          },
        }
      : {};

    const [
      totalPosts,
      totalCategories,
      totalUsers,
      totalViewsAggregate,
      totalComments
    ] = await prisma.$transaction([
      prisma.post.count({ where: whereClause }),
      prisma.category.count({ where: whereClause }),
      prisma.user.count({ where: whereClause }),
      prisma.post.aggregate({ where: whereClause, _sum: { views: true } }),
      prisma.comment.count({ where: whereClause }),
    ]);

    const stats = {
      totalPosts,
      totalCategories,
      totalUsers,
      totalViews: totalViewsAggregate._sum.views || 0,
      totalComments
    };

    await redis.set(this.REDIS_KEY + (frequency || "all-time"), JSON.stringify(stats), 'EX', this.CACHE_TTL_SECONDS);

    return stats;
  }


}
