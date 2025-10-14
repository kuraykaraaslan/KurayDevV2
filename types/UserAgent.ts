enum OSName {
  Windows = "Windows",
  macOS = "macOS",
  Android = "Android",
  iOS = "iOS",
  ChromeOS = "Chrome OS",
  Linux = "Linux",
  Unix = "Unix",
  Unknown = "Unknown"
}

enum DeviceType {
  Mobile = "Mobile",
  Tablet = "Tablet",
  Desktop = "Desktop"
}

enum BrowserName {
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
  latitude?: number | null;
  longitude?: number | null;
};

type OSPattern = {
  pattern: RegExp;
  name: OSName;
};

export type { GeoLocation, OSPattern };
export { OSName, DeviceType, BrowserName };