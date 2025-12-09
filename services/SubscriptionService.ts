//SubscriptionService

import { Subscription } from "@/types/SubscriptionTypes";
import {prisma} from '@/libs/prisma';
import PostService from "./PostService";
import MailService from "./NotificationService/MailService";

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

    static async sendWeeklyDigestToAll(): Promise<void> {
        
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - 7); // Son 7 gün
        thisWeekStart.setHours(0, 0, 0, 0);

        const { posts } = await PostService.getAllPosts({
            createdAfter: thisWeekStart,
            status: "PUBLISHED",
            page: 0,
            pageSize: 5,
        });

        if (posts.length === 0) {
            console.log("No new blog posts this week. Skipping digest email.");
            return;
        }

        const subscriptions = await this.getAllSubscriptions({ includeDeleted: false });

        console.log(`Sending weekly digest to ${subscriptions.length} subscribers.`);
        console.log(`Number of new posts: ${posts.length}`);

        for (const subscription of subscriptions) {
            if (!subscription.deletedAt) {
                MailService.sendWeeklyDigestEmail(subscription.email, posts);
            }
        }

    }
}
