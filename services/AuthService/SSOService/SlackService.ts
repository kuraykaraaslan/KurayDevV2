// services/AuthService/SSOService/SlackService.ts
import axios from 'axios'

export default class SlackService {
  static CLIENT_ID = process.env.SLACK_CLIENT_ID!
  static CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET!
  static CALLBACK_URL = `${process.env.NEXT_PUBLIC_APPLICATION_HOST}/api/auth/callback/slack`

  static AUTH_URL = 'https://slack.com/oauth/v2/authorize'
  static TOKEN_URL = 'https://slack.com/api/oauth.v2.access'
  static USERINFO_URL = 'https://slack.com/api/users.identity'

  static generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      scope: 'identity.basic,identity.email',
      redirect_uri: this.CALLBACK_URL,
      state,
    })

    return `${this.AUTH_URL}?${params.toString()}`
  }

  static async getAccessToken(code: string) {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
      code,
      redirect_uri: this.CALLBACK_URL,
    })

    const { data } = await axios.post(this.TOKEN_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!data.ok) throw new Error(data.error || 'Slack token fetch failed')
    return data.authed_user.access_token
  }

  static async getUserInfo(accessToken: string) {
    const { data } = await axios.get(this.USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!data.ok) throw new Error(data.error || 'Slack user info fetch failed')

    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      avatar: data.user.image_192,
      provider: 'slack',
    }
  }

  static async authCallback(code: string) {
    const accessToken = await this.getAccessToken(code)
    const user = await this.getUserInfo(accessToken)
    return user
  }
}
