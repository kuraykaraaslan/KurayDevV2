const ActivityPubMessages = {
  FOLLOWER_NOT_FOUND: 'ActivityPub follower not found',
  INVALID_ACTIVITY: 'Invalid ActivityPub activity',
  INVALID_ACTIVITY_TYPE: 'Unsupported ActivityPub activity type',
  SIGNATURE_VERIFICATION_FAILED: 'HTTP Signature verification failed',
  DELIVERY_FAILED: 'Failed to deliver activity to remote inbox',
  ACTOR_FETCH_FAILED: 'Failed to fetch remote actor',
  PRIVATE_KEY_MISSING: 'ACTIVITYPUB_PRIVATE_KEY environment variable is not set',
  PUBLIC_KEY_MISSING: 'ACTIVITYPUB_PUBLIC_KEY environment variable is not set',
  SITE_URL_MISSING: 'NEXT_PUBLIC_SITE_URL environment variable is not set',
} as const

export default ActivityPubMessages
export type ActivityPubMessage = (typeof ActivityPubMessages)[keyof typeof ActivityPubMessages]
