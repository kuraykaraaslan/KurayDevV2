import axios from "axios";
import crypto from "crypto";
import { NextRequest } from "next/server"; 
import { UserAgentData } from "@/types/UserSessionTypes";
import redis from "@/libs/redis"; 
import { GeoLocation, OSPattern, OSName, DeviceType, BrowserName } from "@/types/UserAgent";


export default class UserAgentService {
  private static readonly osPatterns: OSPattern[] = [
    { pattern: /Windows NT/i, name: OSName.Windows },
    { pattern: /Mac OS X/i, name: OSName.macOS },
    { pattern: /Android/i, name: OSName.Android },
    { pattern: /(iPhone|iPad|iPod)/i, name: OSName.iOS },
    { pattern: /CrOS/i, name: OSName.ChromeOS },
    { pattern: /Linux/i, name: OSName.Linux },
    { pattern: /X11/i, name: OSName.Unix }
  ];

  static async getGeoLocationFromMaxMind(ip: string): Promise<GeoLocation> {
    const cacheKey = `geo:location:${ip}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const accountId = process.env.MAXMIND_ACCOUNT_ID;
    const apiKey = process.env.MAXMIND_API_KEY;

    if (!accountId || !apiKey) {
      throw new Error("MaxMind credentials are missing in environment variables.");
    }

    const auth = Buffer.from(`${accountId}:${apiKey}`).toString("base64");

    try {
      const response = await axios.get(`https://geoip.maxmind.com/geoip/v2.1/city/${ip}`, {
        headers: {
          Authorization: `Basic ${auth}`
        },
        timeout: 5000 // 5 saniyelik timeout
      });

      const data = response.data;
      const location: GeoLocation = {
        city: data.city?.names?.en ?? null,
        state: data.subdivisions?.[0]?.names?.en ?? null,
        country: data.country?.names?.en ?? null,
        latitude: data.location?.latitude ?? null,
        longitude: data.location?.longitude ?? null
      };

      await redis.set(cacheKey, JSON.stringify(location), "EX", 86400); // 1 gün cache

      return location;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error("MaxMind request failed:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error("Unexpected error during MaxMind lookup:", error);
      }

      return { city: null, state: null, country: null };
    }
  }


  public static getOS(userAgent: string): OSName {
    for (const { pattern, name } of UserAgentService.osPatterns) {
      if (pattern.test(userAgent)) return name;
    }
    return OSName.Unknown;
  }

  public static getDeviceType(userAgent: string): DeviceType {
    if (/iPad/i.test(userAgent)) return DeviceType.Tablet;
    if (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) return DeviceType.Tablet;

    const mobilePattern = /(iPhone|iPod|Mobile|Android.*Mobile|BlackBerry|Windows Phone)/i;
    if (mobilePattern.test(userAgent)) return DeviceType.Mobile;

    return DeviceType.Desktop;
  }

  public static async getGeoLocation(ip: string): Promise<GeoLocation> {
    return UserAgentService.getGeoLocationFromMaxMind(ip);
  }

  public static getBrowser(userAgent: string): BrowserName {
    if (/Edg/i.test(userAgent)) return BrowserName.Edge;
    if (/OPR/i.test(userAgent)) return BrowserName.Opera;
    if (/Chrome/i.test(userAgent)) return BrowserName.Chrome;
    if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return BrowserName.Safari;
    if (/Firefox/i.test(userAgent)) return BrowserName.Firefox;
    if (/MSIE|Trident/i.test(userAgent)) return BrowserName.IE;
    if (/Postman/i.test(userAgent)) return BrowserName.Postman;
    return BrowserName.Unknown;
  }

  public static async generateDeviceFingerprint(ip: string, userAgent: string, acceptLanguage: string): Promise<string> {
    const rawFingerprint = `${ip}|${userAgent}|${acceptLanguage}`;
    return crypto.createHash("sha256").update(rawFingerprint).digest("hex");
  }

  public static async parseRequest(request: NextRequest): Promise<UserAgentData> {
    const userAgent = request.headers.get("user-agent") || "";
    const rawIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-client-ip") ||
      request.headers.get("x-cluster-client-ip") ||
      request.headers.get("x-forwarded");

    const ip = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : rawIp;
    return await UserAgentService.parse(userAgent, ip as string);
  }

  public static async parse(userAgent?: string, ip?: string): Promise<UserAgentData> {
    const geo = ip ? await UserAgentService.getGeoLocation(ip) : null;

    return {
      os: userAgent ? UserAgentService.getOS(userAgent) : OSName.Unknown,
      device: userAgent ? UserAgentService.getDeviceType(userAgent) : DeviceType.Desktop,
      city: geo?.city ?? "Unknown",
      state: geo?.state ?? "Unknown",
      country: geo?.country ?? "Unknown",
      ip: ip ?? "Unknown",
      browser: userAgent ? UserAgentService.getBrowser(userAgent) : BrowserName.Unknown,
      deviceFingerprint: userAgent && ip
        ? crypto.createHash("sha256").update(`${ip}|${userAgent}`).digest("hex")
        : null
    };
  }
}
