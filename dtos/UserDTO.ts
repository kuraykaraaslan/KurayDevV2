import { z } from "zod";
import UserMessages from "@/messages/UserMessages";

// Request DTOs
export const GetUsersRequestSchema = z.object({
    page: z.number().int().default(1),
    pageSize: z.number().int().default(10),
    search: z.string().optional(),
});

export const CreateUserRequestSchema = z.object({
    email: z.string().email(UserMessages.INVALID_EMAIL),
    password: z.string().min(8, UserMessages.PASSWORD_TOO_SHORT),
    name: z.string().min(1, UserMessages.NAME_REQUIRED),
    phone: z.string().optional(),
    image: z.string().optional(),
});

export const UpdateUserRequestSchema = CreateUserRequestSchema.partial().extend({
    userId: z.string().min(1, "User ID is required"),
});

export const GetUserByIdRequestSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
});

// Response DTOs
export const UserResponseSchema = z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
    phone: z.string().nullable(),
    image: z.string().nullable(),
    role: z.enum(['ADMIN', 'USER', 'GUEST']),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const UserListResponseSchema = z.object({
    users: z.array(UserResponseSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
});

export const UserPrivateResponseSchema = UserResponseSchema.extend({
    password: z.string().optional(),
});

// Type exports
export type GetUsersRequest = z.infer<typeof GetUsersRequestSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type GetUserByIdRequest = z.infer<typeof GetUserByIdRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type UserPrivateResponse = z.infer<typeof UserPrivateResponseSchema>;
