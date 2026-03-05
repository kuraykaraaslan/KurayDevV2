import redis from '@/libs/redis'

/** A viewer is considered "active" if they sent a heartbeat within the last 45 seconds. */
const ACTIVE_WINDOW_MS = 45_000
/** Redis key TTL — auto-expires after all viewers have left. */
const KEY_TTL_SEC = 90

export default class ViewerService {
  private static key(slug: string) {
    return `viewers:${slug}`
  }

  /**
   * Register or refresh an active viewer for a given slug.
   * Uses a sorted set keyed by token, scored by timestamp.
   * Returns the current active viewer count.
   */
  static async heartbeat(slug: string, token: string): Promise<number> {
    const key = this.key(slug)
    const now = Date.now()
    const cutoff = now - ACTIVE_WINDOW_MS

    await redis
      .pipeline()
      .zadd(key, now, token)             // upsert this viewer with current timestamp
      .zremrangebyscore(key, 0, cutoff)  // evict stale viewers
      .expire(key, KEY_TTL_SEC)          // reset TTL so the key self-cleans
      .exec()

    return redis.zcard(key)
  }

  /**
   * Returns the current active viewer count without registering a new viewer.
   * Also evicts stale entries as a side-effect.
   */
  static async getCount(slug: string): Promise<number> {
    const key = this.key(slug)
    const cutoff = Date.now() - ACTIVE_WINDOW_MS

    await redis
      .pipeline()
      .zremrangebyscore(key, 0, cutoff)
      .expire(key, KEY_TTL_SEC)
      .exec()

    return redis.zcard(key)
  }
}
