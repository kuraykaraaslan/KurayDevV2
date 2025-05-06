import prisma from "@/libs/prisma";
import bcrypt from "bcrypt";

// Other Services
import UserService from "../UserService";
import SMSService from "../NotificationService/SMSService";
import MailService from "../NotificationService/MailService";

// Utils
import SafeUser from "@/types/SafeUser";
import AuthMessages from "@/messages/AuthMessages";

export default class AuthService {

    static readonly SafeUserSelect = {
        userId: true,
        email: true,
        name: true,
        phone: true,
        userRole: true,
        otpEnabled: true,
        createdAt: true,
        updatedAt: true,
    };



    /**
     * Token Generation
     * @returns A random token 6 characters long with only numbers.
     */
    static generateToken(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }


    /**
     * Hashes the password.
     * @param password - The password to hash.
     * @returns The hashed password.
     */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }


    /**
     * Authenticates a user by email and password.
     * @param email - The user's email.
     * @param password - The user's password.
     * @returns The authenticated user.
     */
    static async login({ email, password } : { email: string, password: string }): Promise<SafeUser> {

        // Get the user by email
        const user = await prisma.user.findUnique({
            where: { email: email },
        })

        if (!user) {
            throw new Error(AuthMessages.INVALID_EMAIL_OR_PASSWORD);
        }

        // Compare the password with the hash

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error(AuthMessages.INVALID_EMAIL_OR_PASSWORD);
        }
        
        return UserService.omitSensitiveFields(user);
    }

    /**
     * Logs out a user by deleting the session.
     * @param token - The session token.
     */
    static async logout({ accessToken }: { accessToken: string }): Promise<void> {

        // Check if the session exists
        const sessions = await prisma.userSession.findMany({
            where: { accessToken: accessToken }
        });

        if (sessions.length === 0) {
            throw new Error(AuthMessages.SESSION_NOT_FOUND);
        }

        // Delete the session if found
        await prisma.userSession.deleteMany({
            where: { accessToken: accessToken }
        });
    }


    /**
     * Registers a new user.
     * @param email - The user's email.
     * @param password - The user's password.
     * @returns The registered user.
     */
    static async register({ email, password, name, phone }: { email: string, password: string, name: string, phone: string }): Promise<SafeUser> {

        // TODO: Validate the input data

        // Check if the user already exists
        const existingUser = await UserService.getByEmail(email);

        if (existingUser) {
            throw new Error(AuthMessages.EMAIL_ALREADY_EXISTS);
        }

        // Create the user
        const createdUser = await prisma.user.create({
            data: {
                name,
                phone,
                email,
                password: await AuthService.hashPassword(password),
            },
        });

        // Send a welcome email
        await MailService.sendWelcomeEmail(createdUser);
        await SMSService.sendShortMessage({
            to: createdUser.phone!,
            body: `Welcome ${createdUser.name || createdUser.email}! Your account has been created successfully.`,
        });

        // Create a session for the user
        return UserService.omitSensitiveFields(createdUser);
    }

    /**
     * Checks if a user has the required role.
     * @param user - The user object.
     * @param requiredRoles - The required roles.
     * @returns Whether the user has the required role.
     */
    public static checkIfUserHasRole(user: SafeUser, requiredRole: string): boolean {

        const roles = [
            'SUPER_ADMIN',
            'ADMIN',
            'USER',
            'GUEST'
        ];

        const userRoleIndex = roles.indexOf(user.userRole);
        const requiredRoleIndex = roles.indexOf(requiredRole);

        return userRoleIndex <= requiredRoleIndex;
    }



}


