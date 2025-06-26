//SubscriptionService

import { Subscription } from "@/types/SubscriptionTypes";
import prisma from "@/libs/prisma";

export default class SubscriptionService {

    static async getSubscriptions(): Promise<Subscription[]> {
        return await prisma.subscription.findMany();
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
