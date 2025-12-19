import { authenticator } from 'otplib';
import bcrypt from 'bcrypt';
import redis from '@/libs/redis';
import AuthMessages from '@/messages/AuthMessages';
import AuthService from '@/services/AuthService';
import { SafeUser } from '@/types/UserTypes';
import { SafeUserSession } from '@/types/UserSessionTypes';
import { OTPAction } from '@/types/UserSecurityTypes';

export default class TOTPService {
  static TOTP_STEP_SECONDS = parseInt(process.env.TOTP_STEP_SECONDS || '30');
  static TOTP_WINDOW = parseInt(process.env.TOTP_WINDOW || '1');
  static TOTP_DIGITS = parseInt(process.env.OTP_LENGTH || '6');
  static SETUP_EXPIRY_SECONDS = parseInt(process.env.TOTP_SETUP_EXPIRY_SECONDS || '600');
  static ISSUER = process.env.TOTP_ISSUER || 'Relatia';

  static setupOtpLib() {
    authenticator.options = {
      step: TOTPService.TOTP_STEP_SECONDS,
      window: TOTPService.TOTP_WINDOW,
      digits: TOTPService.TOTP_DIGITS,
    } as any;
  }

  static getRedisKey({ userSessionId, action }: { userSessionId: string; action: OTPAction | 'setup' }) {
    return `totp:${action}:${userSessionId}`;
  }

  static generateSecret() {
    TOTPService.setupOtpLib();
    return authenticator.generateSecret();
  }

  static getOtpauthURL({ user, secret }: { user: SafeUser; secret: string }) {
    TOTPService.setupOtpLib();
    const label = user.email;
    return authenticator.keyuri(label, TOTPService.ISSUER, secret);
  }

  // Start TOTP setup: generate temporary secret and return otpauth URL
  static async requestSetup({ user, userSession }: { user: SafeUser; userSession: SafeUserSession }) {
    const tempSecret = TOTPService.generateSecret();
    const otpauthUrl = TOTPService.getOtpauthURL({ user, secret: tempSecret });

    const redisKey = TOTPService.getRedisKey({ userSessionId: userSession.userSessionId, action: 'setup' });
    await redis.set(redisKey, tempSecret, 'EX', TOTPService.SETUP_EXPIRY_SECONDS);

    return { secret: tempSecret, otpauthUrl };
  }

  static verifyTokenWithSecret(otpToken: string, secret: string): boolean {
    TOTPService.setupOtpLib();
    return authenticator.check(otpToken, secret);
  }

  // Verify the code against the temp secret and enable TOTP for the user
  static async verifyAndEnable({ user, userSession, otpToken }: { user: SafeUser; userSession: SafeUserSession; otpToken: string }) {
    const setupKey = TOTPService.getRedisKey({ userSessionId: userSession.userSessionId, action: 'setup' });
    const tempSecret = await redis.get(setupKey);

    if (!tempSecret) {
      throw new Error(AuthMessages.INVALID_OTP);
    }

    const valid = TOTPService.verifyTokenWithSecret(otpToken, tempSecret);
    if (!valid) {
      throw new Error(AuthMessages.INVALID_OTP);
    }

    const { userSecurity } = await AuthService.getUserSecurity(user.userId);

    const newMethods = Array.from(new Set([...(userSecurity.otpMethods || []), 'TOTP_APP']));

    await AuthService.updateUserSecurity(user.userId, {
      otpSecret: tempSecret,
      otpMethods: newMethods as any,
    });

    await redis.del(setupKey);

    return { enabled: true };
  }

  // Verify a login/authenticate action using persisted secret
  static async verifyAuthenticate({ user, otpToken }: { user: SafeUser; otpToken: string }) {
    const { userSecurity } = await AuthService.getUserSecurity(user.userId);

    if (!userSecurity.otpMethods.includes('TOTP_APP' as any) || !userSecurity.otpSecret) {
      throw new Error(AuthMessages.INVALID_OTP_METHOD);
    }

    const ok = TOTPService.verifyTokenWithSecret(otpToken, userSecurity.otpSecret);
    if (!ok) {
      throw new Error(AuthMessages.INVALID_OTP);
    }

    return { verified: true };
  }

  // Try TOTP first; if it fails, fallback to backup codes
  static async verifyAuthenticateOrBackup({ user, otpToken }: { user: SafeUser; otpToken: string }) {
    try {
      await TOTPService.verifyAuthenticate({ user, otpToken });
      return { verified: true, method: 'TOTP' };
    } catch (_) {
      const consumed = await TOTPService.consumeBackupCode({ user, code: otpToken });
      if (!consumed.consumed) {
        throw new Error(AuthMessages.INVALID_OTP);
      }
      return { verified: true, method: 'BACKUP_CODE' };
    }
  }

  static async disable({ user }: { user: SafeUser }) {
    const { userSecurity } = await AuthService.getUserSecurity(user.userId);
    const newMethods = (userSecurity.otpMethods || []).filter(m => m !== 'TOTP_APP');
    await AuthService.updateUserSecurity(user.userId, {
      otpSecret: null,
      otpMethods: newMethods as any,
      otpBackupCodes: [],
    });
    return { disabled: true };
  }

  // Generate backup codes, store hashed; return plaintext codes to the user
  static async generateBackupCodes({ user, count = 10 }: { user: SafeUser; count?: number }) {
    const { userSecurity } = await AuthService.getUserSecurity(user.userId);
    if (!userSecurity.otpMethods.includes('TOTP_APP' as any) || !userSecurity.otpSecret) {
      throw new Error(AuthMessages.INVALID_OTP_METHOD);
    }

    const codes: string[] = [];
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const makeCode = () => {
      let raw = '';
      for (let i = 0; i < 8; i++) raw += charset[Math.floor(Math.random() * charset.length)];
      return `${raw.slice(0,4)}-${raw.slice(4,8)}`;
    };

    for (let i = 0; i < count; i++) codes.push(makeCode());
    const hashed = await Promise.all(codes.map((c) => bcrypt.hash(c, 10)));

    await AuthService.updateUserSecurity(user.userId, {
      otpBackupCodes: hashed as any,
    });

    return { codes };
  }

  // Consume a backup code: verify and remove it from stored list
  static async consumeBackupCode({ user, code }: { user: SafeUser; code: string }) {
    const { userSecurity } = await AuthService.getUserSecurity(user.userId);
    const list = userSecurity.otpBackupCodes || [];
    if (!list.length) {
      return { consumed: false };
    }

    let matchIndex = -1;
    for (let i = 0; i < list.length; i++) {
      const ok = await bcrypt.compare(code, list[i]);
      if (ok) { matchIndex = i; break; }
    }

    if (matchIndex === -1) {
      return { consumed: false };
    }

    const newList = list.filter((_, idx) => idx !== matchIndex);
    await AuthService.updateUserSecurity(user.userId, {
      otpBackupCodes: newList as any,
    });

    return { consumed: true };
  }
}
