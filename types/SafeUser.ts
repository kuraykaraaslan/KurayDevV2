import { OTPMethod } from "@prisma/client";

class SafeUser {
    userId!: string;
    email!: string;
    phone?: string | null;
    name?: string | null;
    userRole!: string;
    createdAt?: Date;
    updatedAt?: Date;
    profilePicture?: string | null;
    otpMethods?: OTPMethod[];
}

export default SafeUser;