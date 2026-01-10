// proxy.ts
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LANG = "en";
const SUPPORTED_LANGS = ["en", "tr", "de", "fr"];

const EXCLUDED_PATHS = [
  /^\/api\/?/,
  /^\/auth\/?/,
  /^\/admin\/?/,
  /^\/_next\/?/,
  /^\/assets\/?/,
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2|ttf|eot)$/i,
];

const isDev = process.env.NODE_ENV !== "production";

function log(...args: any[]) {
  return;
  if (isDev) {
    console.log("[LANG-PROXY]", ...args);
  }
}

function isExcluded(pathname: string) {
  return EXCLUDED_PATHS.some((regex) => regex.test(pathname));
}

function isLocalhost(host: string) {
  return (
    host === "localhost" ||
    host.startsWith("localhost:") ||
    host === "127.0.0.1" ||
    host.startsWith("127.0.0.1:")
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";

  log("request", { host, pathname });

  // ❌ Hariç path
  if (isExcluded(pathname)) {
    log("excluded path → skip");
    return NextResponse.next();
  }

  // ❌ Zaten /lang altındaysa
  if (pathname.startsWith("/lang/")) {
    log("already under /lang → skip");
    return NextResponse.next();
  }

  let lang = DEFAULT_LANG;

  if (isLocalhost(host)) {
    log("localhost detected → force lang:", DEFAULT_LANG);
  } else {
    const subdomain = host.split(".")[0];
    if (SUPPORTED_LANGS.includes(subdomain)) {
      lang = subdomain;
      log("lang from subdomain:", lang);
    } else {
      log("no valid subdomain → fallback:", DEFAULT_LANG);
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = `/frontend/${lang}${pathname}`;

  // prod'da da en azından rewrite'ı görelim
  if (!isDev) {
    console.log(
      "[LANG-PROXY]",
      host,
      pathname,
      "→",
      url.pathname
    );
  } else {
    log("rewrite →", url.pathname);
  }

  return NextResponse.rewrite(url);
}
