import axios from 'axios';
import { SSOProfileResponse } from '@/types/common';

export default class GoogleService {

    // App URL
    static APPLICATION_HOST = process.env.APPLICATION_HOST;


    // Google OAuth
    static GOOGLE_CALLBACK_PATH = "/api/auth/callback/google";
    static GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    static GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
    static GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
    static GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;


    
    /*
    * Create Google SSO Link
    * @returns The SSO link.
    */
    static generateAuthUrl(): string {

        const params = {
            client_id: process.env.GOOGLE_CLIENT_ID!,
            redirect_uri: `${this.APPLICATION_HOST}${this.GOOGLE_CALLBACK_PATH}`,
            response_type: 'code',
            scope: 'profile email', // Request access to profile and email
            access_type: 'offline', // Request a refresh token
            prompt: 'consent', // Force consent screen
        };

        return `${this.GOOGLE_AUTH_URL}?${new URLSearchParams(params).toString()}`;
    }


    /*
    * Get Tokens from Google
    * @param code - The code from the callback.
    * @returns The access token and refresh token.
    * @throws Error if the request fails.
    */
    static async getTokens(code: string): Promise<{ access_token: string; refresh_token: string }> {

        const tokenResponse = await axios.post(
            this.GOOGLE_TOKEN_URL,
            new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                code,
                redirect_uri: `${this.APPLICATION_HOST}${this.GOOGLE_CALLBACK_PATH}`,
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
    * Get Google User Info
    * @param accessToken - The access token.
    * @returns The user info.
    */
    static async getUserInfo(accessToken: string): Promise<SSOProfileResponse> {
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = userInfoResponse.data;

        return {
            email: data.email,
            sub: data.sub, // Google's unique ID for the user
            name: data.name,
            picture: data.picture, // Profile picture URL
            provider: 'google', // Add provider field
        };

    }

}