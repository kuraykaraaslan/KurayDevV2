import bcrypt from "bcrypt";
export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
export type RequiredKeys<T> = Exclude<KeysOfType<T, Exclude<T[keyof T], undefined>>, undefined>;
export type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

export default class FieldValidater {
    static emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    static passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    static tokenRegex = /^[0-9]{6}$/;
    static sqlInjectionRegex = /[\s\[\]{}()*+?.,\\^$|#]/;
    static domainRegex = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/;

    /**
     * Validates if the provided email matches the email regex pattern.
     * @param email - The email string to validate.
     * @returns `true` if valid, `false` otherwise.
     */
    static isEmail(email: string | undefined | null): boolean {
        if (!email || typeof email !== "string") return false;
        return this.emailRegex.test(email);
    }

    /**
     * Validates if the provided password matches the password regex pattern.
     * @param password - The password string to validate.
     * @returns `true` if valid, `false` otherwise.
     */
    static isPassword(password: string | undefined | null): boolean {
        if (!password || typeof password !== "string") return false;
        return this.passwordRegex.test(password);
    }

    /**
     * Validates a string against a custom regex pattern.
     * @param value - The string to validate.
     * @param pattern - The regex pattern to use for validation.
     * @returns `true` if the value matches the pattern, `false` otherwise.
     */
    static validateWithRegex(value: string | undefined | null, pattern: RegExp): boolean {
        if (!value || typeof value !== "string") return false;
        return pattern.test(value);
    }

    /**
     * Validates if the provided value is a valid Code for account verification.
     * @param token - The code string to validate.
     * @returns `true` if valid, `false` otherwise.
     * @see
     * - Code must be 6 characters long.
     * - Code must contain only numbers.
     */
    static isVerificationToken(token: string | undefined | null): boolean {
        if (!token || typeof token !== "string") return false;
        return this.tokenRegex.test(token);
    }

    /**
     * Validates if the provided two passwords match.
     * @param hashedPassword - The hashed password to compare.
     * @param password - The password to compare.
     */
    static async comparePasswords(hashedPassword: string, password: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }


    /**
     * Validates if the provided UUID is a valid UUID.
     * @param cuid - The UUID string to validate.
     * @returns `true` if valid, `false` otherwise.
     * @see
     */
    static isCUID(cuid: string | undefined | null): boolean {
        if (!cuid || typeof cuid !== "string") return false;
        return cuid.length === 25;
    }
    /**
     * Validates a string against database injection attacks and only allows alphanumeric characters.
     * @param value - The string to validate.
     * @returns string - The sanitized string.
     * @see
     * - Only allows alphanumeric characters.
     * - Removes all special characters except for `-` and `_` characters.
     */
    static sanitizeString(value: string | undefined | null): string | undefined {
        // Ensure the value is a string, defaulting to an empty string if null or undefined
        if (!value || typeof value !== "string") return undefined;

        // Sanitize the string by removing unwanted characters
        const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "");

        return sanitized;
    }

    /**
     * Validates phone number starts with + and is followed by numbers.
     * @param phone - The phone number string to validate.
     * @returns `true` if valid, `false` otherwise.
     * @see
     * - Phone number must start with a `+` character.
     * - Phone number must contain only numbers after the `+` character.
     */
    static isPhone(phone: string | undefined | null): boolean {
        if (!phone || typeof phone !== "string") return false;
        return /^\+[0-9]+$/.test(phone);
    }

    /**
     * Validates if the provided role is a valid role.
     * @param role - The role string to validate.
     * @returns `true` if valid, `false` otherwise.
     * @see
     * - Role must be one of the following: `USER`, `ADMIN`, `SUPER_ADMIN`.
     */
    static isRole(role: string | undefined | null): boolean {
        if (!role || typeof role !== "string") return false;
        return ["USER", "ADMIN", "SUPER_ADMIN"].includes(role);
    }

    /**
     * Validates if the provided value is tenant user role.
     * @param tenantUserRole - The tenant user role string to validate.
     * @returns `true` if valid, `false` otherwise.
     * @see
     */ 

    static isTenantUserRole(tenantUserRole: string | undefined | null): boolean {
        if (!tenantUserRole || typeof tenantUserRole !== "string") return false;
        return ["USER", "ADMIN", "SUPER_ADMIN"].includes(tenantUserRole);
    }

    /**
     * Validates if the provided value is tenant user status.
     * @param tenantUserStatus - The tenant user status string to validate.
     * @returns `true` if valid, `false` otherwise.
     * @see
     */
    static isTenantUserStatus(tenantUserStatus: string | undefined | null): boolean {
        if (!tenantUserStatus || typeof tenantUserStatus !== "string") return false;
        return ["ACTIVE", "INACTIVE"].includes(tenantUserStatus);
    }


    /**
     * Validates if the provided value is a valid number.
     * @param value - The number string to validate.
     * @returns `true` if valid, `false` otherwise.
     * @see
     */
    static isNumber(value: string | undefined | null): boolean {
        if (!value || typeof value !== "string") return false;
        return !isNaN(Number(value));
    }

    /**
     * Validates if the provided JSON matches the model.
     * Ensures all fields in the model are present in the JSON
     * and that there are no extra fields in the JSON.
     * @param value - The JSON object to validate.
     * @param model - The model class to validate against.
     * @returns `true` if valid, `false` otherwise.
     */
    static validateBody(body: any = {}, Model: any): boolean {       

        // Create an instance of the model to get the required and optional fields
        const orginalInstance = new Model();
        const allFields = Object.keys(orginalInstance);
        const requiredFields = Object.keys(orginalInstance).filter((key) => key in orginalInstance);
        const optionalFields = Object.keys(orginalInstance).filter((key) => !(key in orginalInstance));

        const bodyFields = Object.keys(body);

        // Check if all required fields are present
        if (requiredFields.some((key) => !bodyFields.includes(key))) {
            return false;
        }

        // Check if there are any extra fields
        if (bodyFields.some((key) => !allFields.includes(key))) {
            return false;
        }

        // Check if optional fields are valid
        if (optionalFields.some((key) => !bodyFields.includes(key))) {
            return false;
        }
           


        return true; // Valid if no issues
    }

    /**
     * Validates if the provided string is a valid domain withouth protocol.
     * @param domain - The domain string to validate.
     * @returns `true` if valid, `false` otherwise.
     */
    static isDomain(domain: string | undefined | null): boolean {
        if (!domain || typeof domain !== "string") return false;
        return this.domainRegex.test(domain);
    }
    

    /**
     * Validates if the provided string is a valid name.
     * @param name - The name string to validate.
     * @returns `true` if valid, `false` otherwise.
     * @see
     */

    static isName(name: string | undefined | null): boolean {
        if (!name || typeof name !== "string") return false;
        return name.length > 5;
    }


    /**
     * Validates if the provided string is a valid tenant status.
     * @param tenantStatus - The tenant status string to validate.
     * @returns `true` if valid, `false` otherwise.
     * @see
     */ 

    static isTenantStatus(tenantStatus: string | undefined | null): boolean {
        if (!tenantStatus || typeof tenantStatus !== "string") return false;
        return ["ACTIVE", "INACTIVE"].includes(tenantStatus);
    }

    /**
     * Validates if the provided string is a valid boolean.
     * @param value - The boolean string to validate.
     * 
     * @returns `true` if valid, `false` otherwise
     */
    static isBoolean(value: boolean | undefined | null): boolean {
        if (value === undefined || value === null) return false;
        return typeof value === "boolean";
    }
}

