import Logger from '@/libs/logger';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { User } from '@prisma/client';

// Types
import { SafeUser } from '@/types/UserTypes';
import { SafeUserSession } from '@/types/UserSessionTypes';

// Libs
import { Queue, Worker } from 'bullmq';
import redisInstance from '@/libs/redis';

const MAIL_HOST = process.env.MAIL_HOST || "localhost";
const MAIL_PORT = process.env.MAIL_PORT || 587;
const MAIL_USER = process.env.MAIL_USER || "info@example.com";
const MAIL_PASS = process.env.MAIL_PASS || "password";

const pwd = process.env.PWD || process.cwd();

export default class MailService {
    static _initialized = false;

    static readonly QUEUE_NAME = "mailQueue";

    static readonly QUEUE = new Queue(MailService.QUEUE_NAME, {
        connection: redisInstance,
    });

    static readonly WORKER = new Worker(MailService.QUEUE_NAME, async job => {
        const { to, subject, html } = job.data;
        Logger.info(`MAIL /MailService/Worker ${job.id} processing...`);
        await MailService._sendMail(to, subject, html);
    }, {
        connection: redisInstance,
    });

    static {
        if (!MailService._initialized) {
            MailService.WORKER.on('completed', (job) => {
                Logger.info(`MAIL /MailService/Worker ${job.id} completed`);
            });

            MailService.WORKER.on('failed', (job, err) => {
                Logger.error(`MAIL /MailService/Worker ${(job?.id ?? 'unknown')} failed: ${err.message}`);
            });
        }
    }

    static readonly TEMPLATE_PATH = path.join(pwd, 'views', 'email');
    static readonly APPLICATION_NAME = process.env.APPLICATION_NAME || "Express Boilerplate";
    static readonly FRONTEND_URL = process.env.FRONTEND_HOST + ":" + process.env.FRONTEND_PORT;

    static readonly FRONTEND_LOGIN_PATH = process.env.FRONTEND_LOGIN_PATH || "/auth/login";
    static readonly FRONTEND_REGISTER_PATH = process.env.FRONTEND_REGISTER_PATH || "/auth/register";
    static readonly FRONTEND_PRIVACY_PATH = process.env.FRONTEND_PRIVACY_PATH || "/privacy";
    static readonly FRONTEND_TERMS_PATH = process.env.FRONTEND_TERMS_PATH || "/terms-of-use";
    static readonly FRONTEND_RESET_PASSWORD_PATH = process.env.FRONTEND_RESET_PASSWORD_PATH || "/auth/reset-password";
    static readonly FRONTEND_FORGOT_PASSWORD_PATH = process.env.FRONTEND_FORGOT_PASSWORD_PATH || "/auth/forgot-password";
    static readonly FRONTEND_SUPPORT_EMAIL = process.env.FRONTEND_SUPPORT_EMAIL || "support@example.com";

    // Tekrar eden sabit değişkenler
    static getBaseTemplateVars() {
        return {
            appName: MailService.APPLICATION_NAME,
            loginLink: MailService.FRONTEND_URL + MailService.FRONTEND_LOGIN_PATH,
            resetPasswordLink: MailService.FRONTEND_URL + MailService.FRONTEND_RESET_PASSWORD_PATH,
            forgotPasswordLink: MailService.FRONTEND_URL + MailService.FRONTEND_FORGOT_PASSWORD_PATH,
            termsLink: MailService.FRONTEND_URL + MailService.FRONTEND_TERMS_PATH,
            privacyLink: MailService.FRONTEND_URL + MailService.FRONTEND_PRIVACY_PATH,
            supportEmail: MailService.FRONTEND_SUPPORT_EMAIL,
        };
    }

    static readonly transporter = nodemailer.createTransport({
        host: MAIL_HOST,
        port: Number(MAIL_PORT),
        secure: Number(MAIL_PORT) === 465,
        auth: { user: MAIL_USER, pass: MAIL_PASS },
    });

    static async sendMail(to: string, subject: string, html: string) {
        try {
            await MailService.QUEUE.add('sendMail', { to, subject, html });
        } catch (error: any) {
            Logger.error("MAIL /MailService/sendMail " + to + " " + subject + " " + error.message);
        }
    }

    static async _sendMail(to: string, subject: string, html: string) {
        try {
            await MailService.transporter.sendMail({
                from: `${MailService.APPLICATION_NAME} <${MAIL_USER}>`,
                to, subject, html,
            });
        } catch (error: any) {
            Logger.error("MAIL /MailService/_sendMail " + to + " " + subject + " " + error.message);
        }
    };

    // ---------- Emails ----------

    static async sendWelcomeEmail(user: User | SafeUser) {
        const emailContent = await ejs.renderFile(
            path.join(MailService.TEMPLATE_PATH, 'welcome.ejs'),
            {
                ...MailService.getBaseTemplateVars(),
                user: { name: user.name || user.email }
            }
        );
        await MailService.sendMail(user.email, 'Welcome to ' + MailService.APPLICATION_NAME, emailContent);
    }

    static async sendNewLoginEmail(user: User | SafeUser, userSession?: SafeUserSession) {
        const emailContent = await ejs.renderFile(
            path.join(MailService.TEMPLATE_PATH, 'new-login.ejs'),
            {
                ...MailService.getBaseTemplateVars(),
                user: { name: user.name || user.email },
                device: "Unknown",
                ip: "Unknown",
                location: "Unknown",
                loginTime: new Date().toLocaleString(),
            }
        );
        await MailService.sendMail(user.email, 'New Login Detected', emailContent);
    }

    static async sendForgotPasswordEmail(email: string, name?: string | null, resetToken?: string) {
        const emailContent = await ejs.renderFile(
            path.join(MailService.TEMPLATE_PATH, 'forgot-password.ejs'),
            {
                ...MailService.getBaseTemplateVars(),
                user: { name: name || email },
                resetToken,
                resetLink: MailService.FRONTEND_URL +
                  MailService.FRONTEND_FORGOT_PASSWORD_PATH +
                  "?resetToken=" + resetToken + "&email=" + email,
                expiryTime: 1,
            }
        );
        await MailService.sendMail(email, 'Reset Your Password', emailContent);
    }

    static async sendPasswordResetSuccessEmail(email: string, name?: string | null) {
        const emailContent = await ejs.renderFile(
            path.join(MailService.TEMPLATE_PATH, 'password-reset.ejs'),
            {
                ...MailService.getBaseTemplateVars(),
                user: { name: name || email },
            }
        );
        await MailService.sendMail(email, 'Password Reset Successful', emailContent);
    }

    static async sendOTPEmail({ email, name, otpToken }: { email: string; name?: string | null; otpToken: string; }) {
        if (!otpToken) throw new Error("OTP token is required");
        if (!email) throw new Error("Email is required");

        const emailContent = await ejs.renderFile(
            path.join(MailService.TEMPLATE_PATH, 'otp.ejs'),
            {
                ...MailService.getBaseTemplateVars(),
                user: { name: name || email },
                otpToken,
            }
        );
        await MailService.sendMail(email, 'Your OTP Code', emailContent);
    }

    static async sendOTPEnabledEmail(email: string, name?: string) {
        const emailContent = await ejs.renderFile(
            path.join(MailService.TEMPLATE_PATH, 'otp-enabled.ejs'),
            {
                ...MailService.getBaseTemplateVars(),
                user: { name: name || email },
            }
        );
        await MailService.sendMail(email, 'OTP Enabled', emailContent);
    }

    static async sendOTPDisabledEmail(email: string, name?: string) {
        const emailContent = await ejs.renderFile(
            path.join(MailService.TEMPLATE_PATH, 'otp-disabled.ejs'),
            {
                ...MailService.getBaseTemplateVars(),
                user: { name: name || email },
            }
        );
        await MailService.sendMail(email, 'OTP Disabled', emailContent);
    }
}
