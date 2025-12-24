import { UserSocialAccount } from "@/generated/prisma";
import {prisma} from '@/libs/prisma';

// Other Services
import UserService from "../UserService";

export default class SocialAccountService {

    static async addOrUpdateSocialAccount(
        userId: string,
        provider: string,
        providerId: string,
        accessToken?: string,
        refreshToken?: string,
        profilePicture?: string
    ): Promise<UserSocialAccount> {
        try {
            const existingAccount = await prisma.userSocialAccount.findUnique({
                where: { provider: provider, providerId: providerId },
            });

            if (existingAccount) {
                return await prisma.userSocialAccount.update({
                    where: { providerId: providerId },
                    data: {
                        accessToken,
                        refreshToken,
                        profilePicture,
                        updatedAt: new Date(),
                    },
                });
            }

            return await prisma.userSocialAccount.create({
                data: {
                    userId,
                    provider,
                    providerId,
                    accessToken,
                    refreshToken,
                    profilePicture,
                },
            });
        } catch (error: any) {
            throw new Error(`Error adding/updating social account: ${error.message}`);
        }
    }

    /**
     * Finds a user's social account by provider
     */
    static async getSocialAccountByProvider(
        provider: string,
        providerId: string
    ): Promise<UserSocialAccount | null> {
        try {
            return await prisma.userSocialAccount.findUnique({
                where: {
                    provider,
                    providerId,
                },
            });
        } catch (error: any) {
            throw new Error(`Error fetching social account: ${error.message}`);
        }
    }

    /**
     * Links a social account to an existing user by email
     */
    static async linkSocialAccountToUser(
        email: string,
        provider: string,
        providerId: string,
        accessToken?: string,
        refreshToken?: string,
        profilePicture?: string
    ): Promise<UserSocialAccount | null> {
        try {
            const user = await UserService.getByEmail(email);

            if (!user) {
                throw new Error("User not found");
            }

            return await this.addOrUpdateSocialAccount(
                user.userId,
                provider,
                providerId,
                accessToken,
                refreshToken,
                profilePicture
            );
        } catch (error: any) {
            throw new Error(`Error linking social account: ${error.message}`);
        }
    }

    /**
     * Unlinks a social account from a user
     */
    static async unlinkSocialAccount(
        userId: string,
        provider: string
    ): Promise<void> {
        try {
            await prisma.userSocialAccount.deleteMany({
                where: { userId, provider },
            });
        } catch (error: any) {
            throw new Error(`Error unlinking social account: ${error.message}`);
        }
    }

    /**
     * Retrieves all social accounts linked to a user
     */
    static async getAllUserSocialAccounts(userId: string): Promise<UserSocialAccount[]> {
        try {
            return await prisma.userSocialAccount.findMany({
                where: { userId },
            });
        } catch (error: any) {
            throw new Error(`Error retrieving social accounts: ${error.message}`);
        }
    }

}
