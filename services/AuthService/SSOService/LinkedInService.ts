import axios from 'axios'
import { SSOProfileResponse } from '@/types/common/SSOTypes'

export default class LinkedInService {
  // App URL
  static APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

  // LinkedIn OAuth
  static LINKEDIN_CALLBACK_PATH = '/api/v1/sso/callback/linkedin'
  static LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
  static LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
  static LINKEDIN_USER_INFO_URL = 'https://api.linkedin.com/v2/userinfo'
  static LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!
  static LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!

  /*
   * Create LinkedIn SSO Link
   * @returns The SSO link.
   */
  static generateAuthUrl(): string {
    const params = {
      client_id: this.LINKEDIN_CLIENT_ID,
      redirect_uri: `${this.APPLICATION_HOST}${this.LINKEDIN_CALLBACK_PATH}`,
      response_type: 'code',
      scope: 'openid profile email', // Request access to profile and email
    }

    return `${this.LINKEDIN_AUTH_URL}?${new URLSearchParams(params).toString()}`
  }

  /*
   * Get Tokens from LinkedIn
   * @param code - The code from the callback.
   * @returns The access token.
   * @throws Error if the request fails.
   */
  static async getTokens(code: string): Promise<{ access_token: string }> {
    const tokenResponse = await axios.post(
      this.LINKEDIN_TOKEN_URL,
      new URLSearchParams({
        client_id: this.LINKEDIN_CLIENT_ID,
        client_secret: this.LINKEDIN_CLIENT_SECRET,
        code,
        redirect_uri: `${this.APPLICATION_HOST}${this.LINKEDIN_CALLBACK_PATH}`,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    return {
      access_token: tokenResponse.data.access_token,
    }
  }

  /*
   * Get LinkedIn User Info
   * @param accessToken - The access token.
   * @returns The user info.
   * @throws Error if the request fails.
   */
  static async getUserInfo(accessToken: string): Promise<SSOProfileResponse> {
    const userInfoResponse = await axios.get(this.LINKEDIN_USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = userInfoResponse.data

    return {
      email: data.email, // LinkedIn's email field
      sub: data.sub, // LinkedIn's unique ID for the user
      name: data.name, // Full name
      picture: data.picture, // Profile picture URL
      provider: 'linkedin', // Add provider field
    }
  }
}
