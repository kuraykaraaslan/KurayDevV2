import axios from 'axios';
import { SSOProfileResponse } from '@/types/common';

export default class GithubService {

    // App URL
    static APPLICATION_HOST = process.env.APPLICATION_HOST;

    // GitHub OAuth
    static GITHUB_CALLBACK_PATH = "/api/v1/sso/callback/github";
    static GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
    static GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
    static GITHUB_USER_INFO_URL = 'https://api.github.com/user';
    static GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
    static GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

    /*
     * Create GitHub SSO Link
     * @returns The SSO link.
     */
    static generateAuthUrl(): string {
        const params = {
            client_id: this.GITHUB_CLIENT_ID,
            redirect_uri: `${this.APPLICATION_HOST}${this.GITHUB_CALLBACK_PATH}`,
            scope: 'user', // Request access to user info
            state: 'random_string_to_prevent_csrf', // Optional: Add a state parameter for CSRF protection
        };

        return `${this.GITHUB_AUTH_URL}?${new URLSearchParams(params).toString()}`;
    }

    /*
     * Get Tokens from GitHub
     * @param code - The code from the callback.
     * @returns The access token.
     * @throws Error if the request fails.
     */
    static async getTokens(code: string): Promise<{ access_token: string }> {
        const tokenResponse = await axios.post(
            this.GITHUB_TOKEN_URL,
            new URLSearchParams({
                client_id: this.GITHUB_CLIENT_ID,
                client_secret: this.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: `${this.APPLICATION_HOST}${this.GITHUB_CALLBACK_PATH}`,
            }),
            {
                headers: {
                    'Accept': 'application/json', // GitHub returns JSON by default
                },
            }
        );

        return {
            access_token: tokenResponse.data.access_token,
        };
    }

    /*
     * Get GitHub User Info
     * @param accessToken - The access token.
     * @returns The user info.
     * @throws Error if the request fails.
     */
    static async getUserInfo(accessToken: string): Promise<SSOProfileResponse> {
        const userInfoResponse = await axios.get(this.GITHUB_USER_INFO_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = userInfoResponse.data;

        return {
            sub: data.id.toString(), // GitHub's unique ID for the user
            email: data.email || '', // Email may not be available
            name: data.name || '',
            picture: data.avatar_url || '', // User's avatar URL
            provider: 'github', // Provider name
        };

    }
}