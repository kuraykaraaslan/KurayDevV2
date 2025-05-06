import axiosInstance from '@/libs/axios';

export default class MicrosoftService {

    // App URL
    static APPLICATION_HOST = process.env.APPLICATION_HOST;

    // Microsoft OAuth (Azure AD)
    static MICROSOFT_CALLBACK_PATH = "/api/v1/sso/callback/microsoft";
    static MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
    static MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    static MICROSOFT_USER_INFO_URL = 'https://graph.microsoft.com/v1.0/me';
    static MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
    static MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;

    /*
     * Create Microsoft SSO Link
     * @returns The SSO link.
     */
    static generateAuthUrl(): string {
        const params = {
            client_id: this.MICROSOFT_CLIENT_ID,
            redirect_uri: `${this.APPLICATION_HOST}${this.MICROSOFT_CALLBACK_PATH}`,
            response_type: 'code',
            scope: 'openid profile email', // Request access to profile and email
            prompt: 'consent', // Force consent screen
        };

        return `${this.MICROSOFT_AUTH_URL}?${new URLSearchParams(params).toString()}`;
    }

    /*
     * Get Tokens from Microsoft
     * @param code - The code from the callback.
     * @returns The access token and refresh token.
     * @throws Error if the request fails.
     */
    static async getTokens(code: string): Promise<{ access_token: string; refresh_token: string }> {
        const tokenResponse = await axiosInstance.post(
            this.MICROSOFT_TOKEN_URL,
            new URLSearchParams({
                client_id: this.MICROSOFT_CLIENT_ID,
                client_secret: this.MICROSOFT_CLIENT_SECRET,
                code,
                redirect_uri: `${this.APPLICATION_HOST}${this.MICROSOFT_CALLBACK_PATH}`,
                grant_type: 'authorization_code',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return {
            access_token: tokenResponse.data.access_token,
            refresh_token: tokenResponse.data.refresh_token,
        };
    }

    /*
     * Get Microsoft User Info
     * @param accessToken - The access token.
     * @returns The user info.
     * @throws Error if the request fails.
     */
    static async getUserInfo(accessToken: string): Promise<{
        id: string; // Microsoft's unique ID for the user
        displayName: string;
        mail: string; // User's email
        userPrincipalName: string; // User's principal name (e.g., username@domain.com)
    }> {
        const userInfoResponse = await axiosInstance.get(this.MICROSOFT_USER_INFO_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return userInfoResponse.data;
    }
}