/**
 * GET /.well-known/security.txt
 *
 * RFC 9116 — Security disclosure policy endpoint.
 * Security researchers use this to find the responsible-disclosure contact
 * and policy for this site.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? ''
  const contact = process.env.SECURITY_TXT_CONTACT ?? `mailto:info@${new URL(siteUrl).hostname}`
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString() // 1 year

  const body = [
    `Contact: ${contact}`,
    `Expires: ${expires}`,
    `Policy: ${siteUrl}/.well-known/security.txt`,
    `Preferred-Languages: en, tr`,
  ].join('\n')

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
