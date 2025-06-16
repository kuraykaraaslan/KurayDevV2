import redis from "@/libs/redis";

export default class GitlabService {
  static REDIS_KEY = "gitlab:contributions";
  static CACHE_TTL_SECONDS = 60 * 60 * 24; // 1 gün

  static async getMockContributions(): Promise<any> {
    const cached = await redis.get(this.REDIS_KEY);
    if (cached) return JSON.parse(cached);

    // Simüle edilmiş sabit data
    const mock = {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            weeks: Array.from({ length: 10 }).map((_, i) => ({
              firstDay: `2025-06-${(i + 1).toString().padStart(2, "0")}`,
              contributionDays: Array.from({ length: 7 }).map((_, j) => ({
                date: `2025-06-${(i + 1).toString().padStart(2, "0")}`,
                weekday: j,
                contributionCount: Math.floor(Math.random() * 10),
                color: "#c6e48b"
              }))
            }))
          }
        }
      }
    };

    await redis.set(this.REDIS_KEY, JSON.stringify(mock), "EX", this.CACHE_TTL_SECONDS);
    return mock;
  }
}
