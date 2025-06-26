import axios from 'axios';

export default class AutodeskService {

    static APPLICATION_HOST = process.env.APPLICATION_HOST;
    static AUTODESK_CLIENT_ID = process.env.AUTODESK_CLIENT_ID!;
    static AUTODESK_CLIENT_SECRET = process.env.AUTODESK_CLIENT_SECRET!;
    static AUTODESK_CALLBACK_PATH = '/api/auth/sso/autodesk/callback';

    static AUTODESK_AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/authorize';
    static AUTODESK_TOKEN_URL = 'https://developer.api.autodesk.com/authentication/v2/token';
    static AUTODESK_USER_INFO_URL = 'https://developer.api.autodesk.com/userprofile/v1/users/@me';

    /*
     * Create Autodesk SSO Link
     */
    static generateAuthUrl(): string {
        const params = {
            client_id: this.AUTODESK_CLIENT_ID,
            response_type: 'code',
            redirect_uri: `${this.APPLICATION_HOST}${this.AUTODESK_CALLBACK_PATH}`,
            scope: 'data:read data:write account:read account:write user-profile:read',
        };

        return `${this.AUTODESK_AUTH_URL}?${new URLSearchParams(params).toString()}`;
    }

    /*
     * Get Tokens from Autodesk
     */
    static async getTokens(code: string): Promise<{ access_token: string }> {
        const response = await axios.post(this.AUTODESK_TOKEN_URL,
            new URLSearchParams({
                client_id: this.AUTODESK_CLIENT_ID,
                client_secret: this.AUTODESK_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${this.APPLICATION_HOST}${this.AUTODESK_CALLBACK_PATH}`,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        return { access_token: response.data.access_token };
    }

    /*
     * Get Autodesk User Info
     */
    static async getUserInfo(accessToken: string): Promise<{
        id: string;
        email: string;
        name: string;
        profileImages?: string[];
    }> {
        const response = await axios.get(this.AUTODESK_USER_INFO_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        console.log('Autodesk User Info Response:', response.data);

        const { userId, emailId, firstName, lastName, profileImages } = response.data;
        return {  id: userId,
             email: emailId, name: `${firstName} ${lastName}`, profileImages };
    }
}
