'use client';
import axiosInstance from "@/libs/axios";
import { Session, User } from "@prisma/client";

export const ClientAuthService = {
    async login(email: string, password: string): Promise<Session> {
        const response = await axiosInstance.post("/api/auth/login", {
            email,
            password,
        });
        return response.data;
    },

    async register(email: string, password: string): Promise<User> {
        const response = await axiosInstance.post("/api/auth/register", {
            email,
            password,
        });
        return response.data;
    },

    async logout(sessionToken: string): Promise<void> {
        await axiosInstance.post("/api/auth/logout", {
            sessionToken,
        });
    },
};

export default ClientAuthService;