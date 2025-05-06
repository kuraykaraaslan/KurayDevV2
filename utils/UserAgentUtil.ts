import geoip from "geoip-lite";
import { UserAgentData } from "@/types/UserAgentData";
   

// Enums
export enum OSName {
  Windows = "Windows",
  macOS = "macOS",
  Android = "Android",
  iOS = "iOS",
  ChromeOS = "Chrome OS",
  Linux = "Linux",
  Unix = "Unix",
  Unknown = "Unknown"
}

export enum DeviceType {
  Mobile = "Mobile",
  Tablet = "Tablet",
  Desktop = "Desktop"
}

export enum BrowserName {
  Chrome = "Chrome",
  Firefox = "Firefox",
  Safari = "Safari",
  Edge = "Edge",
  IE = "IE",
  Opera = "Opera",
  Postman = "Postman",
  Unknown = "Unknown"
}

type GeoLocation = {
  city: string | null;
  state: string | null;
  country: string | null;
};

type OSPattern = {
  pattern: RegExp;
  name: OSName;
};

export default class UserAgentUtil {
  private static readonly osPatterns: OSPattern[] = [
    { pattern: /Windows NT/i, name: OSName.Windows },
    { pattern: /Mac OS X/i, name: OSName.macOS },
    { pattern: /Android/i, name: OSName.Android },
    { pattern: /(iPhone|iPad|iPod)/i, name: OSName.iOS },
    { pattern: /CrOS/i, name: OSName.ChromeOS },
    { pattern: /Linux/i, name: OSName.Linux },
    { pattern: /X11/i, name: OSName.Unix }
  ];

  public static getOS(userAgent: string): OSName {
    for (const { pattern, name } of UserAgentUtil.osPatterns) {
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

  public static getGeoLocation(ip: string): GeoLocation {
    const lookup = geoip.lookup(ip);
    return {
      city: lookup?.city ?? null,
      state: lookup?.region ?? null,
      country: lookup?.country ?? null
    };
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

  public static parseRequest(request: NextRequest): UserAgentData {
    const userAgent = request.headers.get("user-agent") || "";
    const rawIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-client-ip") ||
      request.headers.get("x-cluster-client-ip") ||
      request.headers.get("x-forwarded")

    const ip = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : rawIp;
    return UserAgentUtil.parse(userAgent, ip as string);
  }

  public static parse(userAgent?: string, ip?: string): UserAgentData {
    const geo = ip ? UserAgentUtil.getGeoLocation(ip) : null;

    return {
      os: userAgent ? UserAgentUtil.getOS(userAgent) : OSName.Unknown,
      device: userAgent ? UserAgentUtil.getDeviceType(userAgent) : DeviceType.Desktop,
      city: geo?.city ?? "Unknown",
      state: geo?.state ?? "Unknown",
      country: geo?.country ?? "Unknown",
      ip: ip ?? "Unknown",
      browser: userAgent ? UserAgentUtil.getBrowser(userAgent) : BrowserName.Unknown
    };
  }
}
