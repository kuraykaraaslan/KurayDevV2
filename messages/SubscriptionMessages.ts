export enum SubscriptionMessages {
  SUBSCRIPTION_SUCCESS = 'You have been successfully subscribed.',
  SUBSCRIPTION_ERROR = 'An error occurred while trying to subscribe.',
  UNSUBSCRIPTION_SUCCESS = 'You have been successfully unsubscribed.',
  UNSUBSCRIPTION_ERROR = 'An error occurred while trying to unsubscribe.',
  SUBSCRIPTION_NOT_FOUND = 'Subscription not found.',
  PREFERENCES_UPDATED = 'Newsletter preferences updated successfully.',
  PREFERENCES_NOT_FOUND = 'No active subscription found for this email.',
  INVALID_TOKEN = 'Invalid or missing unsubscribe token.',
}
