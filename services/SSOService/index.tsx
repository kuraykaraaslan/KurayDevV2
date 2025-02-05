import prisma from '../../libs/prisma';
import AuthService from '../AuthService';
import UserService from '../UserService';
import GoogleService from './GoogleService';
import AppleService from './AppleService';
import FacebookService from './FacebookService';
import GithubService from './GithubService';
import LinkedInService from './LinkedInService';
import MicrosoftService from './MicrosoftService';
import TwitterService from './TwitterService';

import bcrypt from 'bcrypt';
import SettingService from '../SettingService';

export default class SSOService {


    // Error Messages
    private static INVALID_PROVIDER = "Invalid provider";
    private static AUTHENTICATION_FAILED = "Authentication failed";

    /**
 * Hashes the password.
 * @param password - The password to hash.
 * @returns The hashed password.
 */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    /**
     * Create or Update User
     * @param profile - The user profile.
     * @param accessToken - The access token.
     * @param refreshToken - The refresh token.
     * @returns AuthResponse
     */
    static async loginOrCreateUser(profile: any, accessToken: string, refreshToken: string, provider: string) {
        if (!profile.email) {
            throw new Error('Email is required');
        }

        // Get the user by email
        let user = await prisma.user.findUnique({
            where: { email: profile.email },
        });

        // Create a new user if not found
        if (!user) {
            //Check if registration is enabled
            const registrationEnabled = await SettingService.getSettingByKey("ALLOW_REGISTRATION");

            if (!registrationEnabled) {
                throw new Error("Registration is disabled");
            }

            user = await prisma.user.create({
                data: {
                    email: profile.email,
                    name: profile.name,
                    password: await this.hashPassword(profile.id + new Date().toISOString()),
                },
            });

            // Create a social account
            await prisma.socialAccount.create({
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
                },
            });

            // Update the social account
            const socialAccount = await prisma.socialAccount.findFirst({
                where: {
                    provider: provider,
                    userId: user.userId,
                },
            });

            if (socialAccount) {
                await prisma.socialAccount.update({
                    where: { socialAccountId: socialAccount.socialAccountId },
                    data: {
                        providerId: profile.sub || profile.id,
                        accessToken,
                        refreshToken,
                    },
                });
            } else {
                await prisma.socialAccount.create({
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

        return user;
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
                throw new Error(this.INVALID_PROVIDER);
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
    ) {
        if (!provider || !code) {
            throw new Error('Missing required parametkers');
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
                throw new Error(this.INVALID_PROVIDER);
        }
    }

    /*
     * Handle Google Callback
     * @param code - The code.
     */
    static async handleGoogleCallback(code: string) {
        try {
            const { access_token, refresh_token } = await GoogleService.getTokens(code);

            const profile = await GoogleService.getUserInfo(access_token);

            return this.loginOrCreateUser(profile, access_token, refresh_token, "google");
        } catch (error) {
            console.error('Google authentication failed:', error);
            throw new Error(this.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle Apple Callback
     * @param code - The code.
     */
    static async handleAppleCallback(code: string) {
        try {
            const { access_token, refresh_token } = await AppleService.getTokens(code);
            const profile = await AppleService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, refresh_token, "apple");
        } catch (error) {
            console.error('Apple authentication failed:', error);
            throw new Error(this.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle Facebook Callback
     * @param code - The code.
     */
    static async handleFacebookCallback(code: string) {
        try {
            const { access_token } = await FacebookService.getTokens(code);
            const profile = await FacebookService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, '', "facebook");
        } catch (error) {
            console.error('Facebook authentication failed:', error);
            throw new Error(this.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle GitHub Callback
     * @param code - The code.
     */
    static async handleGithubCallback(code: string) {
        try {
            const { access_token } = await GithubService.getTokens(code);
            const profile = await GithubService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, '', "github");
        } catch (error) {
            console.error('GitHub authentication failed:', error);
            throw new Error(this.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle LinkedIn Callback
     * @param code - The code.
     */
    static async handleLinkedInCallback(code: string) {
        try {
            const { access_token } = await LinkedInService.getTokens(code);
            const profile = await LinkedInService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, '', "linkedin");
        } catch (error) {
            console.error('LinkedIn authentication failed:', error);
            throw new Error(this.AUTHENTICATION_FAILED);
        }
    }

    /*
     * Handle Microsoft Callback
     * @param code - The code.
     */
    static async handleMicrosoftCallback(code: string) {
        try {
            const { access_token, refresh_token } = await MicrosoftService.getTokens(code);
            const profile = await MicrosoftService.getUserInfo(access_token);
            return this.loginOrCreateUser(profile, access_token, refresh_token, "microsoft");
        } catch (error) {
            console.error('Microsoft authentication failed:', error);
            throw new Error(this.AUTHENTICATION_FAILED);
        }
    }
}