import { redirect } from 'next/navigation'

/**
 * GET /.well-known/change-password
 *
 * W3C WICG spec — well-known URL for changing passwords.
 * Password managers (1Password, browsers) redirect here when the user
 * wants to update their password. We forward to the settings security tab.
 */
export async function GET() {
  redirect('/settings')
}
