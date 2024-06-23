import { User } from '@prisma/client';
import prisma from '@/libs/prisma';

export default class UserService {
    static updateUser(userId: string, body: any) {
      throw new Error("Method not implemented.");
    }

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

    static async deleteUser(userId: string): Promise<void> {
        await prisma.user.delete({
            where: {
                userId,
            },
        });
    }
    

    /**
     * Create a new user
     * @param email - The user's email
     * @param password - The user's password
     * @param role - The user's role
     * @returns The new user
     */
    static async createUser(
        email: string,
        password: string,
        role: string,
        slug: string,
        name?: string,
        phone?: string,
        image?: string
    ): Promise<User> {
        // Check if user already exists by email or phone or slug
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        email,
                    },
                    {
                        phone,
                    },
                    {
                        slug,
                    },
                ],
            },        
        });

        if (existingUser) {
            throw new Error('User already exists.');
        }

        // Create the user
        const user = await prisma.user.create({
            data: {
                slug,
                email,
                password,
                role,
                name,
                phone,
                image,
            },
        });

        return user;
    }


    /**
     * Get a user by its ID
     * @param userId - The user's ID
     * @returns The user
     */
    static async getUserById(userId: string): Promise<Pick<User, 'userId' | 'email' | 'name' | 'phone' | 'role' | 'image' | 'slug'> | null> {
        const user = await prisma.user.findUnique({
            where: {
                userId,
            },
            select: {
                userId: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                image: true,
                slug: true,
            },
        });

        return user;
    }
}

