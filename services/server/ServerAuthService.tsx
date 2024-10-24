// AuthService
import { User, Session } from '@prisma/client';
import prisma from '@/libs/prisma';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

export const ServerAuthService = {

    async login(email: string, password: string): Promise<Session> {
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        if (!user.password) {
            throw new Error('CREDS_NOT_FOUND');
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            throw new Error('INVALID_CREDS');
        }

        if (!user.emailVerified) {
            throw new Error('EMAIL_NOT_VERIFIED');
        }

        return this.createSession(user.userId);

    },

    async createSession(userId: string): Promise<Session> {
        const session = await prisma.session.create({
            data: {
                sessionToken: bcrypt.genSaltSync(16), // Generate a session token
                userId,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            },
            select: {
                sessionToken: true,
                user: {
                    select: {
                        userId: true,
                        email: true,
                        emailVerified: true,
                        name: true,
                        role: true,
                    },

                },
            },
        });

        return session as unknown as Session;
    },

    async logout(sessionToken: string): Promise<void> {
        await prisma.session.delete({
            where: {
                sessionToken,
            },
        });
    },

    async register(email: string, password: string): Promise<boolean> {

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            throw new Error('USER_ALREADY_EXISTS');
        }

        if (password.length < 6) {
            throw new Error('PASSWORD_TOO_SHORT');
        }

        const user = await prisma.user.create({
            data: {
                email,
                password: await bcrypt.hash(password, 10),
            },
        });

        return true;
    },

    async verifyEmail(email: string): Promise<void> {
        await prisma.user.update({
            where: {
                email,
            },
            data: {
                emailVerified: new Date(),
            },
        });
    },

    async getUserFromSession(sessionToken: string): Promise<User> {
        const session = await prisma.session.findUnique({
            where: {
                sessionToken,
            },
            select: {
                user: {
                    select: {
                        userId: true,
                        email: true,
                        emailVerified: true,
                        name: true,
                        role: true,
                    },
                }
            },
        });

        if (!session) {
            throw new Error('Session not found');
        }

        return session.user as User;
    },

    async authenticate(request: NextRequest, level: 'USER' | 'ADMIN' = 'USER')
        : Promise<void> {
        
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
           throw new Error('MISSING_FIELDS');
        }

        const authHeaderNoBearer = authHeader.replace('Bearer ', '');

        if (authHeaderNoBearer.length < 10) {
            throw new Error('INVALID_TOKEN');
        }
        
        const user = await this.getUserFromSession(authHeaderNoBearer);

        if (!user) {
            throw new Error('UNAUTHORIZED');
        }

        switch (level) {
            case 'ADMIN':
                if (user.role !== 'ADMIN') {
                    throw new Error('UNAUTHORIZED');
                }
                break;
            default:
                break;
        }

        request.user = user;

        return;

    }



}

export default ServerAuthService;


