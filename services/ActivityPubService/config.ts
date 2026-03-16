import ActivityPubMessages from '@/messages/ActivityPubMessages'

/** Returns the site base URL without trailing slash. */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) throw new Error(ActivityPubMessages.SITE_URL_MISSING)
  return url.replace(/\/$/, '')
}

/** Returns the RSA private key PEM, converting \\n to real newlines. */
export function getPrivateKey(): string {
  const key = process.env.ACTIVITYPUB_PRIVATE_KEY
  if (!key) throw new Error(ActivityPubMessages.PRIVATE_KEY_MISSING)
  return key.replace(/\\n/g, '\n')
}

/** Returns the RSA public key PEM, converting \\n to real newlines. */
export function getPublicKeyPem(): string {
  const key = process.env.ACTIVITYPUB_PUBLIC_KEY
  if (!key) throw new Error(ActivityPubMessages.PUBLIC_KEY_MISSING)
  return key.replace(/\\n/g, '\n')
}

export function getActorUrl(): string  { return `${getSiteUrl()}/api/activitypub/actor` }
export function getKeyId(): string     { return `${getActorUrl()}#main-key` }
export function getInboxUrl(): string  { return `${getSiteUrl()}/api/activitypub/inbox` }
export function getOutboxUrl(): string { return `${getSiteUrl()}/api/activitypub/outbox` }
export function getFollowersUrl(): string { return `${getSiteUrl()}/api/activitypub/followers` }
export function getFollowingUrl(): string { return `${getSiteUrl()}/api/activitypub/following` }
