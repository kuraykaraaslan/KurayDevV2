import { User } from '@prisma/client';
import prisma from '@/libs/prisma';

export default class UserService {

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
    data: {
        page: number;
        pageSize: number;
        search?: string;
    }): Promise<{ users: User[]; total: number }> {
       
        const { page, pageSize, search } = data;

        // Validate search query
        if (search && !this.searchQueryRegex.test(search)) {
            throw new Error('Invalid search query.');
        }

        const query = {
                skip: (page - 1) * pageSize,
                take: pageSize,           
                where: {
                    OR: [
                        {
                            email: {
                                contains: search || '',
                                mode: 'insensitive',
                            },
                        },
                        {
                            phone: {
                                contains: search || '',
                                mode: 'insensitive',
                            },
                        },
                        {
                            slug: {
                                contains: search || '',
                                mode: 'insensitive',
                            },
                        },
                    ],
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
    
            };

        const transaction = await prisma.$transaction([
            prisma.user.findMany(query as any),
            prisma.user.count(query as any),
        ]);
    
        return {
            users: transaction[0],
            total: transaction[1],
        };
    }

    static async deleteUser(userId: string): Promise<void> {

        const user = await prisma.user.findUnique({
            where: {
                userId,
            },
        });

        if (!user) {
            throw new Error('User not found.');
        }

        // check if any admin is present
        const admins = await prisma.user.findMany({
            where: {
                role: 'ADMIN',
            },
        });

        if (admins.length === 1 && admins[0].userId === user.userId) {
            throw new Error('Cannot delete the last admin user.');
        }
   
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

    /**
     * Update a user by its ID
     * @param userId - The user's ID
     * @param data - The updated user data
     * @returns The updated user
     */
    static async updateUser(userId: string, data: Partial<User>): Promise<User> {

        const user = await prisma.user.findUnique({
            where: {
                userId,
            },
        });

        if (!user) {
            throw new Error('User not found.');
        }

        // If the role isnot same, check if any admin is present
        if (data.role && data.role !== user.role) {
            const admins = await prisma.user.findMany({
                where: {
                    role: 'ADMIN',
                },
            });

            if (admins.length === 1 && admins[0].userId === user.userId) {
                throw new Error('Cannot change the role of the last admin user.');
            }
        }

        // Update the user
        const updatedUser = await prisma.user.update({
            where: {
                userId,
            },
            data,
        });

        return updatedUser;
    }
}

    
        
