export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest): Promise<NextResponse> {
    const url = req.nextUrl.clone();
    let pathname = url.pathname;

    /** STATIC BYPASS **/
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/_cloud") ||
        pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2)$/)
    ) {
        return NextResponse.next();
    }

    const forwardedHost = req.headers.get("x-forwarded-host");
    const hostHeader = forwardedHost ?? req.headers.get("host");

    if (!hostHeader) {
        return new NextResponse("Invalid Host", { status: 400 });
    }

    const host = hostHeader.split(":")[0];
    const baseDomain = process.env.APPLICATION_DOMAIN ?? "kuray.dev";

    console.log("[Middleware] Host:", host);
    console.log("[Middleware] Base Domain:", baseDomain);

    if (!baseDomain) {
        console.warn("⚠ APPLICATION_DOMAIN env not set.");
        return NextResponse.next();
    }

    const isSubdomain = host.endsWith("." + baseDomain);
    const isRootDomain = host === baseDomain;
    const isLocalhost = host === "localhost" || host === "127.0.0.1";

    if (isSubdomain) {
        let sub = host.replace("." + baseDomain, "");

        if (sub === "" || sub === "www") {
            sub = "personal";
        }

        console.log("🌐 Detected subdomain:", sub);

        // Zaten rewrite edilmiş bir path'i tekrar rewrite etmemek için:
        if (!pathname.startsWith(`/${sub}`)) {
            url.pathname = `/${sub}${pathname}`;
            console.log("🔁 Rewriting to:", url.pathname);

            const res = NextResponse.rewrite(url);
            res.headers.set("x-forwarded-host", host);
            return res;
        }

        return NextResponse.next();
    }

    if (isRootDomain || isLocalhost) {
        if (!pathname.startsWith("/personal")) {
            url.pathname = `/personal${pathname}`;
            console.log("🔁 Rewriting to (root):", url.pathname);
            return NextResponse.rewrite(url);
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|trpc|api).*)"],
};
