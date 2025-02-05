import axios from 'axios';

export default class TikTokService {

    // App URL
    static APPLICATION_HOST = process.env.APPLICATION_HOST;

    // TikTok OAuth
    static TIKTOK_CALLBACK_PATH = "/api/v1/sso/callback/tiktok";
    static TIKTOK_AUTH_URL = 'https://www.tiktok.com/auth/authorize';
    static TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
    static TIKTOK_USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';
    static TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
    static TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;

    /*
     * Create TikTok SSO Link
     * @returns The SSO link.
     */
    static generateAuthUrl(): string {
        const params = {
            client_key: this.TIKTOK_CLIENT_KEY,
            redirect_uri: `${this.APPLICATION_HOST}${this.TIKTOK_CALLBACK_PATH}`,
            response_type: 'code',
            scope: 'user.info.basic', // Request basic user info
        };

        return `${this.TIKTOK_AUTH_URL}?${new URLSearchParams(params).toString()}`;
    }

    /*
     * Get Tokens from TikTok
     * @param code - The code from the callback.
     * @returns The access token and refresh token.
     * @throws Error if the request fails.
     */
    static async getTokens(code: string): Promise<{ access_token: string; refresh_token: string }> {
        const tokenResponse = await axios.post(
            this.TIKTOK_TOKEN_URL,
            new URLSearchParams({
                client_key: this.TIKTOK_CLIENT_KEY,
                client_secret: this.TIKTOK_CLIENT_SECRET,
                code,
                redirect_uri: `${this.APPLICATION_HOST}${this.TIKTOK_CALLBACK_PATH}`,
                grant_type: 'authorization_code',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
            }
        );

        return {
            access_token: tokenResponse.data.access_token,
            refresh_token: tokenResponse.data.refresh_token,
        };
    }

    /*
     * Get TikTok User Info
     * @param accessToken - The access token.
     * @returns The user info.
     * @throws Error if the request fails.
     */
    static async getUserInfo(accessToken: string): Promise<{
        open_id: string; // TikTok's unique ID for the user
        union_id?: string; // Optional: Union ID for cross-platform identification
        avatar_url: string;
        display_name: string;
    }> {
        const userInfoResponse = await axios.get(this.TIKTOK_USER_INFO_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return userInfoResponse.data;
    }
}