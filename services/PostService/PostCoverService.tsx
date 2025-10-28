import { ImageResponse } from "next/og";
import redis from "@/libs/redis";
import { PostWithData } from "@/types/BlogTypes";

export default class PostCoverService {
  private static readonly CACHE_TTL = 60 * 60 * 24 * 7; // 7 gün
  private static readonly CACHE_PREFIX = "post:og:";

  /**
   * Cache key oluşturur.
   */
  private static key(postId: string) {
    return `${this.CACHE_PREFIX}${postId}`;
  }

  /**
   * Tüm cache’i temizler.
   */
  static async resetAll() {
    const keys = await redis.keys(`${this.CACHE_PREFIX}*`);
    if (keys.length > 0) await redis.del(...keys);
    return { cleared: keys.length };
  }

  /**
   * Belirli bir post için cache temizler.
   */
  static async resetById(postId: string) {
    const key = this.key(postId);
    await redis.del(key);
    return { cleared: true };
  }

  /**
   * OG görseli üretir veya cache'ten döner.
   */
  static async getImage(post: PostWithData): Promise<ImageResponse | null> {
    if (!post.postId) return null;

    const cacheKey = this.key(post.postId);

    const cached = await redis.get(cacheKey);
    if (cached) {
      //Buffer.from(cached, "base64");
      return new ImageResponse(<img src={`data:image/png;base64,${cached}`} width={1200} height={630} />, {
        width: 1200,
        height: 630,
      });
    }

    let title = post.title.length > 110 ? post.title.slice(0, 100) + "..." : post.title;
    title = title.split(":").join(":\n");

    if (post.image) {
      const res = new ImageResponse(
        <img src={post.image} width={1200} height={630} alt={title} />,
        { width: 1200, height: 630 }
      );
      const arrayBuffer = await res.arrayBuffer();
      await redis.setex(cacheKey, this.CACHE_TTL, Buffer.from(arrayBuffer).toString("base64"));
      return res;
    }

    const calculateFontSize = (title: string) => {
      const length = title.length;
      return 22;

      if (length > 100) return 20;
      if (length > 90) return 22;
      if (length > 80) return 24;
      if (length > 70) return 26;
      if (length > 60) return 28;
      if (length > 50) return 30;
      return 60;
    };

    const svgBackground = encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 800 800'>
        <rect fill='#000000' width='1200' height='630'/>
        <g fill-opacity='0.26' opacity='0.36'>
          <circle fill='#000000' cx='400' cy='400' r='600'/>
          <circle fill='#150056' cx='400' cy='400' r='500'/>
          <circle fill='#2900ac' cx='400' cy='400' r='400'/>
          <circle fill='#4004ff' cx='400' cy='400' r='300'/>
          <circle fill='#825aff' cx='400' cy='400' r='200'/>
          <circle fill='#C3B0FF' cx='400' cy='400' r='100'/>
        </g>
      </svg>
    `);

    const header = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: calculateFontSize(title),
          color: "#fff",
          textShadow: "0px 4px 20px rgba(95, 95, 95, 0.4)",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            lineHeight: 1.2,
            fontStyle: "italic",
            margin: 0,
            maxWidth: "1000px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {title}
        </h1>
      </div>
    );

    const res = new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000000",
            backgroundImage: `url("data:image/svg+xml,${svgBackground}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {header}
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { "Cache-Control": "public, max-age=604800" },
      }
    );

    const arrayBuffer = await res.arrayBuffer();
    await redis.setex(cacheKey, this.CACHE_TTL, Buffer.from(arrayBuffer).toString("base64"));

    return res;
  }


  /**
   * Generate All OG Images (for testing or pre-generation)
   */
  static async generateAllOgImages(posts: PostWithData[]) {
    for (const post of posts) {
      await this.getImage(post);
    }
    return { generated: posts.length };
  }
}
