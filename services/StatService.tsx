import prisma from "@/libs/prisma";

export default class StatService {

    /**
     * Get all stats
     * @returns All stats
     */
    static async getAllStats() {
        return await prisma.$transaction([
            //Total number of posts
            prisma.post.count(),
            //Total number of categories
            prisma.category.count(),
            //Total number of users
            prisma.user.count(),
            //Total number of views on all posts
            prisma.post.aggregate({
                _sum: {
                    views: true
                }
            }),
            //Total comments
            prisma.comment.count()
        ]);
    }
}

