import { z } from 'zod';

const OTPMethodEnum = z.enum(['EMAIL', 'SMS', 'TOTP_APP', 'PUSH_APP']);
const OTPActionEnum = z.enum(['enable', 'disable', 'authenticate']);


export { OTPMethodEnum , OTPActionEnum };
export type OTPMethod = z.infer<typeof OTPMethodEnum>;
export type OTPAction = z.infer<typeof OTPActionEnum>;