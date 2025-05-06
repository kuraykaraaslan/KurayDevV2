export interface SafeUserSession {
    userSessionId: string;
    userId: string;
    otpVerifyNeeded: boolean;
    sessionExpiry: Date;
}

export default SafeUserSession;