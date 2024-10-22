import { User } from '@prisma/client';
import prisma from '@/libs/prisma';

export default class UsersService {
    
    // Regular expressions for validation
    private static titleRegex = /^.{1,100}$/; // Title must be between 1 and 100 characters
    private static slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // Slug must be URL-friendly
    private static urlRegex = /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/([\w/_.]*)?)?$/i; // Validates URLs
    private static searchQueryRegex = /^[a-zA-Z0-9\s]{0,100}$/; // Search query validation



    /**
     * Get all users
     * @param page - The page number
     * @param perPage - The number of users per page
     * @param search - The search query
     * @returns An array of users
     */
    static async getAllUsers(
        page = 1,
        perPage = 10,
        search?: string
    ): Promise<User[]> {
       
        // Validate search query
        if (search && !this.searchQueryRegex.test(search)) {
            throw new Error('Invalid search query.');
        }

        if (search && search !== '') {
            // Get users by search query
            const users = await prisma.user.findMany({
                skip: (page - 1) * perPage,
                take: perPage,
                where: {
                    OR: [
                        { name: { contains: search } },
                        { email: { contains: search } },
                    ],
                },
            });

            return users;
        }

        // Get all users
        const users = await prisma.user.findMany({
            skip: 0,
            take: perPage,
        });

        return users;
    }
}

