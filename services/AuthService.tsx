import {User, Session} from "@prisma/client";
import prisma from "@/libs/prisma";
import SessionWithUser from "@/types/SessionWithUser";
import bcrypt from "bcrypt";

export default class AuthService {

    static cuidRegex = /^[a-z0-9]{25}$/;
    static emailRegex = /\S+@\S+\.\S+/;
    // just 6 characters for testing
    static passwordRegex = /^.{6,}$/;
    static nameRegex = /^[a-zA-Z\s]{2,}$/;
    static phoneRegex = /^[0-9]{7,}$/;
    static sessionTokenRegex = /^[a-z0-9]{10,}$/;

    static generateSessionToken(): string {
        // 48 characters
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    static async login(email: string, password: string): Promise<{ session: SessionWithUser }> {

        console.log("AuthService.login");
        console.log("email: ", email);

        if (!this.emailRegex.test(email)) {
            throw new Error("Invalid email format");
        }

        const user = await prisma.user.findFirst({
            where: {
                email,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.password) {
            throw new Error("User has no password");
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            throw new Error("Invalid password");
        }

        const session = await prisma.session.create({
            data: {
                sessionToken: AuthService.generateSessionToken(), // Add this line
                userId: user.userId,
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            },
            select: {
                userId: true,
                sessionToken: true,
                expires: true,
                user: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });

        return { session };

    }

    static async logout(sessionToken: string): Promise<void> {

        if (!this.sessionTokenRegex.test(sessionToken)) {
            throw new Error("Invalid session token");
        }

        await prisma.session.delete({
            where: {
                sessionToken,
            },
        });
    }

    static async register(name: string, email: string, password: string, phone?: string): Promise<User> {

        if (!this.nameRegex.test(name)) {
            throw new Error("Invalid name format");
        }

        if (!this.emailRegex.test(email)) {
            throw new Error("Invalid email format");
        }

        if (!this.passwordRegex.test(password)) {
            throw new Error("Invalid password format");
        }

        if (phone && !this.phoneRegex.test(phone)) {
            throw new Error("Invalid phone format");
        }

        // check if user already exists with the same email and phone
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        email,
                    },
                    {
                        phone,
                    },
                ],
            },
        });

        if (existingUser) {
            throw new Error("User already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password : hashedPassword,
                phone,
            },
        });

        return user;

    }

    static async getSession(sessionTokenWithBearer: string): Promise<SessionWithUser> {

        if (!sessionTokenWithBearer.startsWith("Bearer ")) {
            throw new Error("Invalid session token");
        }

        const sessionToken = sessionTokenWithBearer.replace("Bearer ", "");

        if (!this.sessionTokenRegex.test(sessionToken)) {
            throw new Error("Invalid session token");
        }

        const session = await prisma.session.findFirst({
            where: {
                sessionToken,
            },
            select: {
                sessionToken: true,
                userId: true,
                expires: true,
                user: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });

        if (!session) {
            throw new Error("Session not found");
        }

        if (session.expires < new Date()) {
            throw new Error("Session expired");
        }

        return session;

    }

}