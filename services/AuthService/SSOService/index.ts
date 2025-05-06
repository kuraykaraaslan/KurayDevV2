import prisma from '@/libs/prisma';
import AuthService from '@/services/AuthService';
import UserService from '@/services/UserService';
import GoogleService from './GoogleService';
import AppleService from './AppleService';
import FacebookService from './FacebookService';
import GithubService from './GithubService';
import LinkedInService from './LinkedInService';
import MicrosoftService from './MicrosoftService';
import TwitterService from './TwitterService';
import AuthUserResponse from '@/types/SafeUser';

import { SSOMessages } from '@/messages/SSOMessages';

export default class SSOService {

    static APP_URL = process.env.APPLICATION_HOST + ":" + process.env.APPLICATION_PORT;

    /**
     * Create or Update User
     * @param profile - The user profile.
     * @param accessToken - The access token.
     * @param refreshToken - The refresh token.
     * @returns AuthResponse
     */
    static async loginOrCreateUser(profile: any, accessToken: string, refreshToken: string, provider: string): Promise<AuthUserResponse> {
        if (!profile.email) {
            throw new Error(SSOMessages.EMAIL_NOT_FOUND);
        }

        // Get the user by email
        let user = await prisma.user.findUnique({
            where: { email: profile.email },
        });

        // Create a new user if not found
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: profile.email,
                    name: profile.name,
                    profilePicture: profile.picture,
                    password: await AuthService.hashPassword(profile.id + new Date().toISOString()),
                },
            });

            // Create a social account
            await prisma.userSocialAccount.create({
                data: {
                    provider: provider,
                    providerId: profile.sub || profile.id,
                    accessToken,
                    refreshToken,
                    userId: user.userId,
                },
            });

        } else {
            // Update the user
            user = await prisma.user.update({
                where: { userId: user.userId },
                data: {
                    name: profile.name,
                    profilePicture: profile.picture,
                },
            });

            // Update the social account
            const socialAccount = await prisma.userSocialAccount.findFirst({
                where: {
                    provider: provider,
                    userId: user.userId,
                },
            });

            if (socialAccount) {
                await prisma.userSocialAccount.update({
                    where: { userSocialAccountId: socialAccount.userSocialAccountId },
                    data: {
                        providerId: profile.sub || profile.id,
                        accessToken,
                        refreshToken,
                    },
                });
            } else {
                await prisma.userSocialAccount.create({
                    data: {
                        provider: provider,
                        providerId: profile.sub || profile.id,
                        accessToken,
                        refreshToken,
                        userId: user.userId,
                    },
                });
            }

        }

        return UserService.omitSensitiveFields(user);
    }

    /*
     * Generate SSO Link
     * @param provider - The provider name.
     * @returns The SSO link.
     */
    static generateAuthUrl(provider: string): string {
        switch (provider) {
            case 'google':
                return GoogleService.generateAuthUrl();
            case 'apple':
                return AppleService.generateAuthUrl();
            case 'facebook':
                return FacebookService.generateAuthUrl();
            case 'github':
                return GithubService.generateAuthUrl();
            case 'linkedin':
                return LinkedInService.generateAuthUrl();
            case 'microsoft':
                return MicrosoftService.generateAuthUrl();
            case 'twitter':
                return TwitterService.generateAuthUrl();
            default:
                throw new Error(SSOMessages.INVALID_PROVIDER);
        }
    }

    /*
     * Auth Callback
     * @param provider - The provider name.
     * @param code - The code.
     * @param state - The state.
     * @param scope - The scope.
     */
    static async authCallback(
        provider: string,
        code: string,
        state?: string,
        scope?: string,
    ): Promise<AuthUserResponse> {
        if (!provider || !code) {
            throw new Error(SSOMessages.INVALID_PROVIDER);
        }

        switch (provider) {
            case 'google':
                return this.handleGoogleCallback(code);
            case 'apple':
                return this.handleAppleCallback(code);
            case 'facebook':
                return this.handleFacebookCallback(code);
            case 'github':
                return this.handleGithubCallback(code);
            case 'linkedin':
                return this.handleLinkedInCallback(code);
            case 'microsoft':
                return this.handleMicrosoftCallback(code);
            default:
                throw new Error(SSOMessages.INVALID_PROVIDER);
        }
    }

    /*
     * Handle Google Callback
     * @param code - The code.
     */
    static async handleGoogleCallback(code: string): Promise<AuthUserResponse> {
        try {
            const { access_token, refresh_token } = await GoogleService.getTokens(code);
            const profile = await GoogleService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, refresh_token, "google");
        } catch (error) {
            throw new Error(SSOMessages.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle Apple Callback
     * @param code - The code.
     */
    static async handleAppleCallback(code: string): Promise<AuthUserResponse> {
        try {
            const { access_token, refresh_token, id_token } = await AppleService.getTokens(code);

            const profile = await AppleService.getUserInfo(id_token);
            return this.loginOrCreateUser(profile, access_token, refresh_token, "apple");
        } catch (error) {
            throw new Error(SSOMessages.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle Facebook Callback
     * @param code - The code.
     */
    static async handleFacebookCallback(code: string): Promise<AuthUserResponse> {
        try {
            const { access_token } = await FacebookService.getTokens(code);
            const profile = await FacebookService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, '', "facebook");
        } catch (error) {
            throw new Error(SSOMessages.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle GitHub Callback
     * @param code - The code.
     */
    static async handleGithubCallback(code: string): Promise<AuthUserResponse> {
        try {
            const { access_token } = await GithubService.getTokens(code);
            const profile = await GithubService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, '', "github");
        } catch (error) {
            console.error('GitHub authentication failed:', error);
            throw new Error(SSOMessages.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle LinkedIn Callback
     * @param code - The code.
     */
    static async handleLinkedInCallback(code: string): Promise<AuthUserResponse> {
        try {
            const { access_token } = await LinkedInService.getTokens(code);
            const profile = await LinkedInService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, '', "linkedin");
        } catch (error) {
            console.error('LinkedIn authentication failed:', error);
            throw new Error(SSOMessages.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle Microsoft Callback
     * @param code - The code.
     */
    static async handleMicrosoftCallback(code: string): Promise<AuthUserResponse> {
        try {
            const { access_token, refresh_token } = await MicrosoftService.getTokens(code);
            const profile = await MicrosoftService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, refresh_token, "microsoft");
        } catch (error) {
            console.error('Microsoft authentication failed:', error);
            throw new Error(SSOMessages.AUTHENTICATION_FAILED);
        }
    }
}