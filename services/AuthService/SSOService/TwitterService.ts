import axios from 'axios';
import { SSOProfileResponse } from '@/types/common/SSOTypes';

export default class TwitterService {

    // App URL
    static APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST;

    // Twitter OAuth
    static TWITTER_CALLBACK_PATH = "/api/v1/sso/callback/twitter";
    static TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
    static TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
    static TWITTER_USER_INFO_URL = 'https://api.twitter.com/2/users/me';
    static TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
    static TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;

    /*
     * Create Twitter SSO Link
     * @returns The SSO link.
     */
    static generateAuthUrl(): string {
        const params = {
            client_id: this.TWITTER_CLIENT_ID,
            redirect_uri: `${this.APPLICATION_HOST}${this.TWITTER_CALLBACK_PATH}`,
            response_type: 'code',
            scope: 'tweet.read users.read', // Request access to read tweets and user info
            code_challenge: 'challenge', // Required for PKCE
            code_challenge_method: 'plain', // Use 'S256' for production
        };

        return `${this.TWITTER_AUTH_URL}?${new URLSearchParams(params).toString()}`;
    }

    /*
     * Get Tokens from Twitter
     * @param code - The code from the callback.
     * @returns The access token.
     * @throws Error if the request fails.
     */
    static async getTokens(code: string): Promise<{ access_token: string }> {
        const tokenResponse = await axios.post(
            this.TWITTER_TOKEN_URL,
            new URLSearchParams({
                client_id: this.TWITTER_CLIENT_ID,
                client_secret: this.TWITTER_CLIENT_SECRET,
                code,
                redirect_uri: `${this.APPLICATION_HOST}${this.TWITTER_CALLBACK_PATH}`,
                grant_type: 'authorization_code',
                code_verifier: 'challenge', // Must match the code_challenge from the authorization request
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return {
            access_token: tokenResponse.data.access_token,
        };
    }

    /*
     * Get Twitter User Info
     * @param accessToken - The access token.
     * @returns The user info.
     * @throws Error if the request fails.
     */
    static async getUserInfo(accessToken: string):  Promise<SSOProfileResponse> {
        const userInfoResponse = await axios.get(this.TWITTER_USER_INFO_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = userInfoResponse.data;

        return {
            email: data.email || '', // Twitter may not provide email, handle accordingly
            sub: data.id, // Twitter's unique ID for the user
            name: data.name || '', // User's name
            picture: data.profile_image_url || '', // Profile picture URL
            provider: 'twitter', // Add provider field
        };
    }
}