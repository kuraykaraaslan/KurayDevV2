import axios from 'axios';
import jwt from 'jsonwebtoken';
import { SSOProfileResponse } from '@/types/common/SSOTypes';

export default class AppleService {

    // App URL
    static APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST;

    // Apple OAuth
    static APPLE_CALLBACK_PATH = "/api/auth/callback/apple";
    static APPLE_AUTH_URL = 'https://appleid.apple.com/auth/authorize';
    static APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
    static APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID!;
    static APPLE_TEAM_ID = process.env.APPLE_TEAM_ID!;
    static APPLE_KEY_ID = process.env.APPLE_KEY_ID!;
    static APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY!;



    /*
    * Create Apple SSO Link
    * @returns The SSO link.
    */
    static generateAuthUrl(): string {

        const params = {
            client_id: this.APPLE_CLIENT_ID,
            redirect_uri: `${this.APPLICATION_HOST}${this.APPLE_CALLBACK_PATH}`,
            response_type: 'code',
            scope: 'profile email', // Request access to profile and email
            access_type: 'offline', // Request a refresh token
            prompt: 'consent', // Force consent screen
        };

        return `${this.APPLE_AUTH_URL}?${new URLSearchParams(params).toString()}`;
    }




    /*
    * Generate Apple Client Secret
    * @returns The Apple client secret.
    */
    static generateClientSecret(): string {


        const payload = {
            iss: this.APPLE_TEAM_ID,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            aud: 'https://appleid.apple.com',
            sub: this.APPLE_CLIENT_ID,
        };

        return jwt.sign(payload, this.APPLE_PRIVATE_KEY, {
            algorithm: 'ES256',
            keyid: this.APPLE_KEY_ID,
        });
    }

    /*
    * Get Tokens from Apple
    * @param code - The code from the callback.
    * @returns The access token and refresh token.
    * @throws Error if the request fails
    */
    static async getTokens(code: string): Promise<{ access_token: string; refresh_token: string }> {
        const clientSecret = this.generateClientSecret();



        const tokenResponse = await axios.post(
            this.APPLE_TOKEN_URL,
            new URLSearchParams({
                client_id: this.APPLE_CLIENT_ID,
                client_secret: clientSecret,
                code,
                redirect_uri: `${this.APPLICATION_HOST}${this.APPLE_CALLBACK_PATH}`,
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
    * Get Apple User Info
    * @param accessToken - The access token.
    * @returns The user info.
    * @throws Error if the request fails.
    */
    static async getUserInfo(accessToken: string): Promise<SSOProfileResponse> {
        // Decode the ID token to get user information
        const decodedToken = jwt.decode(accessToken) as { email: string; sub: string };
        return {
            email: decodedToken.email,
            sub: decodedToken.sub, // Apple's unique ID for the user
            provider: 'apple',
        };
    }

}