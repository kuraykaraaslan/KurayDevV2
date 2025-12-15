//SubscriptionService

import { Subscription } from "@/types/SubscriptionTypes";
import {prisma} from '@/libs/prisma';
//import PostService from "./PostService";
//import MailService from "./NotificationService/MailService";

export default class SubscriptionService {

    static async getAllSubscriptions(data: { page?: number; pageSize?: number , includeDeleted?: boolean}): Promise<Subscription[]> {
        return await prisma.subscription.findMany({
            where: {
                deletedAt: data.includeDeleted ? undefined : null
            },
            skip: data.page && data.pageSize ? (data.page) * data.pageSize : undefined,
            take: data.pageSize ? data.pageSize : undefined,
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    static async getSubscriptionByEmail(email: string): Promise<Subscription | null> {
        return await prisma.subscription.findFirst({
            where: {
                email: email
            }
        });
    }

    static async createSubscription(email: string): Promise<Subscription> {
        const existingSubscription = await this.getSubscriptionByEmail(email);
        if (existingSubscription) {
            if (existingSubscription.deletedAt) {
                return await prisma.subscription.update({
                    where: {
                        email: email
                    },
                    data: {
                        deletedAt: null
                    }
                });
            }
            return existingSubscription;
        }

        return await prisma.subscription.create({
            data: {
                email: email
            }
        });
    }
    
    static async deleteSubscription(email: string): Promise<Subscription | null> {
        const existingSubscription = await this.getSubscriptionByEmail(email);
        if (!existingSubscription) {
            return null;
        }

        return await prisma.subscription.update({
            where: {
                email: email
            },
            data: {
                deletedAt: new Date()
            }
        });
    }

}
