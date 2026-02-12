import { z } from 'zod'

// Auth request/response schemas
export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
})

export const RegisterRequestSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const ConfirmPasswordResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const AuthSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  token: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  user: z
    .object({
      userId: z.string(),
      email: z.string().email(),
      userRole: z.enum(['ADMIN', 'USER']),
    })
    .optional(),
})

export const OAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
  provider: z.enum(['GOOGLE', 'GITHUB', 'DISCORD', 'MICROSOFT']),
})

// Types
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>
export type ConfirmPasswordReset = z.infer<typeof ConfirmPasswordResetSchema>
export type ChangePassword = z.infer<typeof ChangePasswordSchema>
export type AuthSession = z.infer<typeof AuthSessionSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
export type OAuthCallback = z.infer<typeof OAuthCallbackSchema>
