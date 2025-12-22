import {prisma} from '@/libs/prisma';
import { User, UserRole, SafeUser, UpdateUser, SafeUserSchema, UserPreferencesDefault, UserSchema } from '@/types/user/UserTypes';
import { UserProfileDefault } from '@/types/user/UserProfileTypes';

// Libraries
import bcrypt from "bcrypt";

// Utils
import FieldValidater from "@/utils/FieldValidater";

export default class UserService {

    /**
     * Error Messages
     * These are the error messages that can be thrown by the service.
     * TODO: Add more error messages as needed.
     */
    static INVALID_EMAIL = "INVALID_EMAIL";
    static INVALID_PASSWORD_FORMAT = "INVALID_PASSWORD_FORMAT";
    static USER_NOT_FOUND = "USER_NOT_FOUND";
    static EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS";




    /**
     * Creates a new user in the database after validating input and hashing the password.
     * @param data - Partial user data to create the user.
     * @returns The created user without sensitive fields like password.
     */
    static async create({ email, password, name, phone, userRole }: {
        email: string,
        password: string,
        name: string,
        phone?: string,
        userRole?: string
    }): Promise<SafeUser> {

        // Validate email and password
        if (!email || !FieldValidater.isEmail(email)) {
            throw new Error(this.INVALID_EMAIL);
        }

        // Check if the email is already in use
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            throw new Error(this.EMAIL_ALREADY_EXISTS);
        }

        if (!password || !FieldValidater.isPassword(password)) {
            throw new Error(this.INVALID_PASSWORD_FORMAT);
        }


        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create Default User Profile
        const userProfile = {
            ...UserProfileDefault,
            name: name || null,
        };

        // Create Default User Preferences
        const userPreferences = {
            ...UserPreferencesDefault,
        };

        // Create the user in the database
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword, // Store the hashed password
                phone,
                userRole: userRole ? userRole as UserRole : "USER", // Default to 'USER' role if not provided
                userStatus: "ACTIVE",
                userProfile: userProfile,
                userPreferences: userPreferences,
            }
        });

        // Exclude sensitive fields from the response
        return SafeUserSchema.parse(user);

    }

    /**
     * Retrieves all users from the database.
     * @param skip - The number of records to skip.
     * @param take - The number of records to take.
     * @param userId - The user ID to filter by.
     * @param tenantId - The tenant ID to filter by.
     * @param search - The search term to filter by.
     * @returns A list of users.
     */
    static async getAll({
        page,
        pageSize,
        search,
        userId,
    }: {
        page: number,
        pageSize: number,
        search?: string,
        userId?: string
    }): Promise<{ users: SafeUser[], total: number }> {


        const queryOptions = {
            skip: (page - 1) * pageSize,
            take: pageSize,
            where: {
                userId: userId ? userId : undefined,
                OR: [
                    { email: { contains: search ? search : '' } },
                    { userProfile: { path: ['name'], string_contains: search ? search : '' } },
                ],
            }
        };

        // Get all users
        const [users, total] = await prisma.$transaction([
            prisma.user.findMany(queryOptions),
            prisma.user.count({ where: queryOptions.where }),
        ]);

        // Exclude sensitive fields from the response
        const usersWithoutPassword = users.map((user) => SafeUserSchema.parse(user));

        return { users: usersWithoutPassword, total };
    }

    /**
     * Retrieves a user from the database by ID.
     * @param userId - The user ID to retrieve.
     * @returns The user details.
     */
    static async getById(userId: string): Promise<SafeUser> {

        // Get the user by ID
        const user = await prisma.user.findUnique({
            where: { userId },
        });

        if (!user) {
            throw new Error(this.USER_NOT_FOUND);
        }

        return SafeUserSchema.parse(user);
    }

    /**
     * Updates a user in the database by ID.
     * @param userId - The user ID to update.
     * @param data - Partial user data to update.
     * @returns The updated user details.
     */
    static async update({ userId, data }: { userId: string, data: UpdateUser }): Promise<SafeUser> {

        if (!userId) {
            throw new Error(this.USER_NOT_FOUND);
        }

        // Get the user by ID
        const user = await prisma.user.findUnique({
            where: { userId },
        });

        if (!user) {
            throw new Error(this.USER_NOT_FOUND);
        }

        // Update the user in the database
        const updatedUser = await prisma.user.update({
            where: { userId: userId },
            data: data as User,
        });

        // Exclude sensitive fields from the response
        return SafeUserSchema.parse(updatedUser);
    }

    /**
     * Deletes a user from the database by ID.
     * @param userId - The user ID to delete.
     * @returns The deleted user details.
     */
    static async delete(userId: string): Promise<void> {

        // Get the user by ID
        const user = await prisma.user.findUnique({
            where: { userId },
        });

        if (!user) {
            throw new Error(this.USER_NOT_FOUND);
        }

        // Delete the user from the database
        await prisma.user.delete({
            where: { userId },
        });

        return;
    }


    /**
     * Retrieves a user from the database by email.
     * @param email - The email to retrieve.
     * @returns The user details.
     */
    static async getByEmail(email: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        console.log(UserSchema.parse(user));

        return user ? UserSchema.parse(user) : null;
    }

}






