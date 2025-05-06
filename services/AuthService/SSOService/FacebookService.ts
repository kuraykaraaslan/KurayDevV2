import axiosInstance from '@/libs/axios';

export default class FacebookService {

    // App URL
    static APPLICATION_HOST = process.env.APPLICATION_HOST;

    // Meta (Facebook) OAuth
    static META_CALLBACK_PATH = "/api/v1/sso/callback/meta";
    static META_AUTH_URL = 'https://www.facebook.com/v17.0/dialog/oauth';
    static META_TOKEN_URL = 'https://graph.facebook.com/v17.0/oauth/access_token';
    static META_USER_INFO_URL = 'https://graph.facebook.com/v17.0/me';
    static META_CLIENT_ID = process.env.META_CLIENT_ID!;
    static META_CLIENT_SECRET = process.env.META_CLIENT_SECRET!;

    /*
     * Create Meta SSO Link
     * @returns The SSO link.
     */
    static generateAuthUrl(): string {
        const params = {
            client_id: this.META_CLIENT_ID,
            redirect_uri: `${this.APPLICATION_HOST}${this.META_CALLBACK_PATH}`,
            response_type: 'code',
            scope: 'email public_profile', // Request access to email and public profile
        };

        return `${this.META_AUTH_URL}?${new URLSearchParams(params).toString()}`;
    }

    /*
     * Get Tokens from Meta
     * @param code - The code from the callback.
     * @returns The access token.
     * @throws Error if the request fails.
     */
    static async getTokens(code: string): Promise<{ access_token: string }> {
        const tokenResponse = await axiosInstance.get(this.META_TOKEN_URL, {
            params: {
                client_id: this.META_CLIENT_ID,
                client_secret: this.META_CLIENT_SECRET,
                code,
                redirect_uri: `${this.APPLICATION_HOST}${this.META_CALLBACK_PATH}`,
            },
        });

        return {
            access_token: tokenResponse.data.access_token,
        };
    }

    /*
     * Get Meta User Info
     * @param accessToken - The access token.
     * @returns The user info.
     * @throws Error if the request fails.
     */
    static async getUserInfo(accessToken: string): Promise<{
        id: string; // Meta's unique ID for the user
        name: string;
        email: string;
        picture: { data: { url: string } }; // Profile picture URL
    }> {
        const userInfoResponse = await axiosInstance.get(this.META_USER_INFO_URL, {
            params: {
                fields: 'id,name,email,picture', // Request specific fields
                access_token: accessToken,
            },
        });

        return userInfoResponse.data;
    }
}