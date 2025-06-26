import { z } from "zod";

import  AuthMessages from "@/messages/AuthMessages";

const LoginRequest = z.object({
    email: z.string().email().refine(
        (email) => email.length > 0,
        {
            message: AuthMessages.INVALID_EMAIL_ADDRESS,
        }
    ),
    password: z.string().min(8,  {
        message: AuthMessages.INVALID_PASSWORD,
    }),
});

const RegisterRequest = z.object({
    email: z.string().email().refine(
        (email) => email.length > 0,
        {
            message: AuthMessages.INVALID_EMAIL_ADDRESS,
        }
    ),
    password: z.string().min(8, {
        message: AuthMessages.INVALID_PASSWORD,
    }),
    name: z.string(),
    phone: z.string().optional(),
});

const ForgotPasswordRequest = z.object({
    email: z.string().email().refine(
        (email) => email.length > 0,
        {
            message: AuthMessages.INVALID_EMAIL_ADDRESS,
        }
    )
    });

const ResetPasswordRequest = z.object({
    email: z.string().email().refine(
        (email) => email.length > 0,
        {
            message: AuthMessages.INVALID_EMAIL_ADDRESS,
        }
    ),
    resetToken: z.string().min(1, {
        message: AuthMessages.INVALID_TOKEN,
    }),
    password: z.string().min(8, {
        message: AuthMessages.INVALID_PASSWORD,
    }),
});

export type LoginRequest = z.infer<typeof LoginRequest>;
export type RegisterRequest = z.infer<typeof RegisterRequest>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequest>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequest>;

export { LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest };