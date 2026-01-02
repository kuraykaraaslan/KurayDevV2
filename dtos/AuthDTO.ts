import { z } from "zod";
import  AuthMessages from "@/messages/AuthMessages";
import { SocialLinkItemSchema } from "@/types/user/UserProfileTypes";

// Login DTOs
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

const LoginResponse = z.object({
    token: z.string(),
    refreshToken: z.string(),
    user: z.object({
        userId: z.string(),
        email: z.string(),
        name: z.string(),
        role: z.enum(['ADMIN', 'USER', 'GUEST']),
    }),
});

// Register DTOs
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

const RegisterResponse = z.object({
    message: z.string(),
    user: z.object({
        userId: z.string(),
        email: z.string(),
        name: z.string(),
    }),
});

// Password Reset DTOs
const ForgotPasswordRequest = z.object({
    email: z.string().email().refine(
        (email) => email.length > 0,
        {
            message: AuthMessages.INVALID_EMAIL_ADDRESS,
        }
    )
});

const ForgotPasswordResponse = z.object({
    message: z.string(),
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

const ResetPasswordResponse = z.object({
    message: z.string(),
});

// OTP DTOs
const OTPSendRequest = z.object({
    method: z.enum(['EMAIL', 'SMS', 'TOTP_APP']),
    action: z.enum(['enable', 'disable', 'authenticate']),
});

const OTPSendResponse = z.object({
    success: z.boolean(),
    message: z.string(),
});

const OTPVerifyRequest = z.object({
    method: z.enum(['EMAIL', 'SMS', 'TOTP_APP']),
    action: z.enum(['enable', 'disable', 'authenticate']),
    otpToken: z.string().min(1, AuthMessages.INVALID_OTP),
});

const OTPVerifyResponse = z.object({
    success: z.boolean(),
    message: z.string(),
});

// Login Verify DTOs (for additional OTP verification during login)
const LoginVerifyRequest = z.object({
    method: z.enum(['EMAIL', 'SMS', 'TOTP_APP']),
    action: z.enum(['authenticate']).default('authenticate'),
    otpToken: z.string().min(1, AuthMessages.INVALID_OTP),
});

const LoginVerifyResponse = z.object({
    success: z.boolean(),
    message: z.string(),
});

// TOTP (2FA) DTOs
const TOTPSetupRequest = z.object({
    // No parameters needed - server generates the secret
});

const TOTPSetupResponse = z.object({
    secret: z.string(),
    qrCode: z.string(), // Base64 encoded QR code image
});

const TOTPEnableRequest = z.object({
    otpToken: z.string().min(6, AuthMessages.INVALID_TOKEN),
});

const TOTPEnableResponse = z.object({
    message: z.string(),
    backupCodes: z.array(z.string()), // Recovery codes
});

const TOTPDisableRequest = z.object({
    otpToken: z.string().min(1, AuthMessages.INVALID_OTP),
});

const TOTPDisableResponse = z.object({
    success: z.boolean(),
    message: z.string(),
});

// Session DTOs
const SessionResponse = z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.enum(['ADMIN', 'USER', 'GUEST']),
    isLoggedIn: z.boolean(),
});

const LogoutResponse = z.object({
    message: z.string(),
});

// Refresh Token DTOs
const RefreshTokenRequest = z.object({
    refreshToken: z.string().min(1, AuthMessages.INVALID_REFRESH_TOKEN),
});

const RefreshTokenResponse = z.object({
    token: z.string(),
    refreshToken: z.string().optional(),
});

// SSO DTOs
const SSOCallbackRequest = z.object({
    code: z.string().min(1, AuthMessages.INVALID_PROVIDER_TOKEN),
    state: z.string().optional(),
});

const SSOCallbackResponse = z.object({
    token: z.string(),
    refreshToken: z.string(),
    user: z.object({
        userId: z.string(),
        email: z.string(),
        name: z.string(),
        image: z.string().optional(),
    }),
});

const SSOProviderRequest = z.object({
    provider: z.enum(['google', 'github', 'discord', 'microsoft']),
});


// Profile Update DTOs
const UpdateProfileRequest = z.object({
    name: z.string().optional(),
    socialLinks: z.array(SocialLinkItemSchema).optional(),
    profilePicture: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    headerImage: z.string().url().optional(),
});

const UpdateProfileResponse = z.object({
    message: z.string(),
    user: z.object({
        userId: z.string(),
        email: z.string(),
        name: z.string(),
        phone: z.string().nullable(),
        image: z.string().nullable(),
    }),
});

// User Preferences DTOs
const UpdatePreferencesRequest = z.object({
    userProfile: z.record(z.any()),
});

const UpdatePreferencesResponse = z.object({
    message: z.string(),
    userProfile: z.record(z.any()),
});

const GetPreferencesResponse = z.object({
    userProfile: z.record(z.any()),
});

// Security Settings DTOs
const GetSecuritySettingsResponse = z.object({
    twoFactorEnabled: z.boolean(),
    lastLogin: z.date().optional(),
    loginHistory: z.array(z.object({
        timestamp: z.date(),
        ipAddress: z.string(),
        userAgent: z.string(),
    })).optional(),
});

// Type Exports
export type LoginRequest = z.infer<typeof LoginRequest>;
export type LoginResponse = z.infer<typeof LoginResponse>;
export type RegisterRequest = z.infer<typeof RegisterRequest>;
export type RegisterResponse = z.infer<typeof RegisterResponse>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequest>;
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponse>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequest>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponse>;
export type OTPSendRequest = z.infer<typeof OTPSendRequest>;
export type OTPSendResponse = z.infer<typeof OTPSendResponse>;
export type OTPVerifyRequest = z.infer<typeof OTPVerifyRequest>;
export type OTPVerifyResponse = z.infer<typeof OTPVerifyResponse>;
export type LoginVerifyRequest = z.infer<typeof LoginVerifyRequest>;
export type LoginVerifyResponse = z.infer<typeof LoginVerifyResponse>;
export type TOTPSetupRequest = z.infer<typeof TOTPSetupRequest>;
export type TOTPSetupResponse = z.infer<typeof TOTPSetupResponse>;
export type TOTPEnableRequest = z.infer<typeof TOTPEnableRequest>;
export type TOTPEnableResponse = z.infer<typeof TOTPEnableResponse>;
export type TOTPDisableRequest = z.infer<typeof TOTPDisableRequest>;
export type TOTPDisableResponse = z.infer<typeof TOTPDisableResponse>;
export type SessionResponse = z.infer<typeof SessionResponse>;
export type LogoutResponse = z.infer<typeof LogoutResponse>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequest>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponse>;
export type SSOCallbackRequest = z.infer<typeof SSOCallbackRequest>;
export type SSOCallbackResponse = z.infer<typeof SSOCallbackResponse>;
export type SSOProviderRequest = z.infer<typeof SSOProviderRequest>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequest>;
export type UpdateProfileResponse = z.infer<typeof UpdateProfileResponse>;
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequest>;
export type UpdatePreferencesResponse = z.infer<typeof UpdatePreferencesResponse>;
export type GetPreferencesResponse = z.infer<typeof GetPreferencesResponse>;
export type GetSecuritySettingsResponse = z.infer<typeof GetSecuritySettingsResponse>;

// Re-export schemas for validation
export {
    LoginRequest as LoginRequestSchema,
    LoginResponse as LoginResponseSchema,
    RegisterRequest as RegisterRequestSchema,
    RegisterResponse as RegisterResponseSchema,
    ForgotPasswordRequest as ForgotPasswordRequestSchema,
    ForgotPasswordResponse as ForgotPasswordResponseSchema,
    ResetPasswordRequest as ResetPasswordRequestSchema,
    ResetPasswordResponse as ResetPasswordResponseSchema,
    OTPSendRequest as OTPSendRequestSchema,
    OTPSendResponse as OTPSendResponseSchema,
    OTPVerifyRequest as OTPVerifyRequestSchema,
    OTPVerifyResponse as OTPVerifyResponseSchema,
    LoginVerifyRequest as LoginVerifyRequestSchema,
    LoginVerifyResponse as LoginVerifyResponseSchema,
    TOTPSetupRequest as TOTPSetupRequestSchema,
    TOTPSetupResponse as TOTPSetupResponseSchema,
    TOTPEnableRequest as TOTPEnableRequestSchema,
    TOTPEnableResponse as TOTPEnableResponseSchema,
    TOTPDisableRequest as TOTPDisableRequestSchema,
    TOTPDisableResponse as TOTPDisableResponseSchema,
    SessionResponse as SessionResponseSchema,
    LogoutResponse as LogoutResponseSchema,
    RefreshTokenRequest as RefreshTokenRequestSchema,
    RefreshTokenResponse as RefreshTokenResponseSchema,
    SSOCallbackRequest as SSOCallbackRequestSchema,
    SSOCallbackResponse as SSOCallbackResponseSchema,
    SSOProviderRequest as SSOProviderRequestSchema,
    UpdateProfileRequest as UpdateProfileRequestSchema,
    UpdateProfileResponse as UpdateProfileResponseSchema,
    UpdatePreferencesRequest as UpdatePreferencesRequestSchema,
    UpdatePreferencesResponse as UpdatePreferencesResponseSchema,
    GetPreferencesResponse as GetPreferencesResponseSchema,
    GetSecuritySettingsResponse as GetSecuritySettingsResponseSchema,
};