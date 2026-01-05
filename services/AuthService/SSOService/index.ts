import {prisma} from '../../../libs/prisma';
import GoogleService from './GoogleService';
import AppleService from './AppleService';
import FacebookService from './FacebookService';
import GithubService from './GithubService';
import LinkedInService from './LinkedInService';
import MicrosoftService from './MicrosoftService';
import TwitterService from './TwitterService';

import bcrypt from 'bcrypt';
import SettingService from '../../SettingService';
import { SSOProfileResponse } from '@/types/common/SSOTypes';
import AutodeskService from './AutodeskService';

import { SSOMessages } from '@/messages/SSOMessages';
import { AuthMessages } from '@/messages/AuthMessages';
import { SafeUser, UserSchema } from '@/types/user/UserTypes';
import { UserSecurity, UserSecuritySchema } from '@/types/user/UserSecurityTypes';
import { User as PrismaUser} from '@/generated/prisma';
import AuthService from '..';


interface SSOProviderService {
    generateAuthUrl: () => string;
    getTokens: (code: string) => Promise<{ access_token: string; refresh_token?: string }>;
    getUserInfo: (accessToken: string) => Promise<SSOProfileResponse>;
}

export default class SSOService {

    private static ALLOWED_PROVIDERS = process.env.SSO_ALLOWED_PROVIDERS?.split(',') || [];

    private static getAllowedProviders(): string[] {
        return this.ALLOWED_PROVIDERS;
    }

    private static PROVIDER_SERVICES: Record<string, SSOProviderService> = {
        "autodesk": AutodeskService,
        "google": GoogleService,
        "apple": AppleService,
        "facebook": FacebookService,
        "github": GithubService,
        "linkedin": LinkedInService,
        "microsoft": MicrosoftService,
        "twitter": TwitterService,
    };

    private static getProviderService(provider: string): SSOProviderService {
        if (!provider || !this.getAllowedProviders().includes(provider)) {
            throw new Error(SSOMessages.INVALID_PROVIDER);
        }

        const service = this.PROVIDER_SERVICES[provider];

        if (!service) {
            throw new Error(SSOMessages.INVALID_PROVIDER);
        }

        return service;
    }

    /**
     * Hashes the password.
     * @param password - The password to hash.
     * @returns The hashed password.
     */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }


    private static async createUserFromSSOProfile(
        profile: SSOProfileResponse,
        accessToken: string,
        refreshToken?: string
    ) {
        const registrationEnabled = await SettingService.getSettingByKey("ALLOW_REGISTRATION");

        if (!registrationEnabled) {
            throw new Error(AuthMessages.REGISTRATION_DISABLED);
        }

        const user = await prisma.user.create({
            data: {
                email: profile.email,
                userProfile: {
                    name: profile.name,
                },
                password: await this.hashPassword(profile.sub + new Date().toISOString()),
            },
        });

        await prisma.userSocialAccount.create({
            data: {
                provider: profile.provider,
                providerId: profile.sub,
                accessToken,
                refreshToken,
                userId: user.userId,
            },
        });

        return user;
    }

    private static async updateUserFromSSOProfile(
        user: PrismaUser,
        profile: SSOProfileResponse,
        accessToken: string,
        refreshToken?: string
    ) {

        const socialAccount = await prisma.userSocialAccount.findFirst({
            where: {
                provider: profile.provider,
                userId: user.userId,
            },
        });

        if (socialAccount) {
            await prisma.userSocialAccount.update({
                where: { userSocialAccountId: socialAccount.userSocialAccountId },
                data: {
                    providerId: profile.sub,
                    accessToken,
                    refreshToken,
                },
            });
        } else {
            await prisma.userSocialAccount.create({
                data: {
                    provider: profile.provider,
                    providerId: profile.sub,
                    accessToken,
                    refreshToken,
                    userId: user.userId,
                },
            });
        }

        return prisma.user.findUnique({ where: { userId: user.userId } });
    }

    /*
     * Generate SSO Link
     * @param provider - The provider name.
     * @returns The SSO link.
     */
    static generateAuthUrl(provider: string): string {

        const providerService = this.getProviderService(provider);

        try {
            return providerService.generateAuthUrl();
        } catch (error) {
            throw new Error(SSOMessages.OAUTH_ERROR);
        }
    }


    /*
     * Auth Callback
     * @param provider - The provider name.
     * @param code - The code.
     * @param state - The state.
     * @param scope - The scope.
     * @returns The user and whether it's a new user.
     */
    static async authCallback(
        provider: string,
        code: string
    ): Promise<{ user: SafeUser; userSecurity: UserSecurity; newUser: boolean }> {
        if (!code) {
            throw new Error(SSOMessages.CODE_NOT_FOUND);
        }

        const providerService = this.getProviderService(provider);

        const { access_token, refresh_token } = await providerService.getTokens(code);

        if (!access_token) {
            throw new Error(SSOMessages.OAUTH_ERROR);
        }

        try {
            const profile = await providerService.getUserInfo(access_token);
            if (!profile.email) {
                throw new Error(SSOMessages.EMAIL_NOT_FOUND);
            }

            let user = await prisma.user.findUnique({
                where: { email: profile.email },
            });

            let newUser = false;

            if (!user) {
                newUser = true;
                user = await this.createUserFromSSOProfile(profile, access_token, refresh_token);
            } else {
                user = await this.updateUserFromSSOProfile(user, profile, access_token, refresh_token);
            }

            if (!user) {
                throw new Error(SSOMessages.OAUTH_ERROR);
            }
            
            const { userSecurity } = await AuthService.getUserSecurity(user.userId);
            
            return { user : UserSchema.parse(user), userSecurity, newUser };
            
        } catch (error) {
            throw new Error(SSOMessages.OAUTH_ERROR);
        }
    }


}