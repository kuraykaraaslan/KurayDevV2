import Logger from '@/libs/logger';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { User } from '@prisma/client';

// Types
import SafeUser from '@/types/SafeUser';
import SafeUserSession from '@/types/SafeUserSession';

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

    // These are the default values, you can change them in the .env file
    static readonly FRONTEND_URL = process.env.FRONTEND_HOST + ":" + process.env.FRONTEND_PORT;

    static readonly FRONTEND_LOGIN_PATH = process.env.FRONTEND_LOGIN_PATH || "/auth/login";
    static readonly FRONTEND_REGISTER_PATH = process.env.FRONTEND_REGISTER_PATH || "/auth/register";
    static readonly FRONTEND_PRIVACY_PATH = process.env.FRONTEND_PRIVACY_PATH || "/privacy";
    static readonly FRONTEND_TERMS_PATH = process.env.FRONTEND_TERMS_PATH || "/terms-of-use";
    static readonly FRONTEND_RESET_PASSWORD_PATH = process.env.FRONTEND_RESET_PASSWORD_PATH || "/auth/reset-password";
    static readonly FRONTEND_FORGOT_PASSWORD_PATH = process.env.FRONTEND_FORGOT_PASSWORD_PATH || "/auth/forgot-password";
    static readonly FRONTEND_SUPPORT_EMAIL = process.env.FRONTEND_SUPPORT_EMAIL || "support@example.com";


    //GENERATED LINK : NOT MODIFY
    static readonly FRONTEND_LOGIN_LINK = MailService.FRONTEND_URL + MailService.FRONTEND_LOGIN_PATH;
    static readonly FRONTEND_REGISTER_LINK = MailService.FRONTEND_URL + MailService.FRONTEND_REGISTER_PATH;
    static readonly FRONTEND_PRIVACY_LINK = MailService.FRONTEND_URL + MailService.FRONTEND_PRIVACY_PATH;
    static readonly FRONTEND_TERMS_LINK = MailService.FRONTEND_URL + MailService.FRONTEND_TERMS_PATH;
    static readonly FRONTEND_RESET_PASSWORD_LINK = MailService.FRONTEND_URL + MailService.FRONTEND_RESET_PASSWORD_PATH;
    static readonly FRONTEND_FORGOT_PASSWORD_LINK = MailService.FRONTEND_URL + MailService.FRONTEND_FORGOT_PASSWORD_PATH;



    static readonly transporter = nodemailer.createTransport({
        host: MAIL_HOST,
        port: Number(MAIL_PORT),

        secure: Number(MAIL_PORT) === 465,
        auth: {
            user: MAIL_USER,
            pass: MAIL_PASS,
        },
    });

    static async sendMail(to: string, subject: string, html: string) {
        try {
            await MailService.QUEUE.add('sendMail', {
                to,
                subject,
                html,
            });
        } catch (error: any) {
            Logger.error("MAIL /MailService/sendMail " + to + " " + subject + " " + error.message);
        }
    }



    static async _sendMail(to: string, subject: string, html: string) {
        try {
            await MailService.transporter.sendMail({
                from: `${MailService.APPLICATION_NAME} <${MAIL_USER}>`,
                to,
                subject,
                html,
            });
        } catch (error: any) {
            Logger.error("MAIL /MailService/sendMail " + to + " " + subject + " " + error.message);
        }
    };


    static async sendWelcomeEmail(user: User | SafeUser) {

        const name = user.name || user.email;
        const email = user.email;

        const emailContent = await ejs.renderFile(path.join(MailService.TEMPLATE_PATH, 'welcome.ejs'), {
            user: { name: name || email },
            appName: MailService.APPLICATION_NAME,
            loginLink: MailService.FRONTEND_LOGIN_LINK,
            termsLink: MailService.FRONTEND_TERMS_LINK,
            privacyLink: MailService.FRONTEND_PRIVACY_LINK,
            supportEmail: MailService.FRONTEND_SUPPORT_EMAIL,
        });

        await MailService.sendMail(email, 'Welcome to ' + MailService.APPLICATION_NAME, emailContent);
    };

    static async sendNewLoginEmail(user: User | SafeUser, userSession?: SafeUserSession) {

        const name = user.name || user.email;
        const email = user.email;

        const emailContent = await ejs.renderFile(path.join(MailService.TEMPLATE_PATH, 'new-login.ejs'), {
            user: { name: name || email },
            appName: MailService.APPLICATION_NAME,
            device: "Unknown",
            ip: "Unknown",
            location: "Unknown",
            loginTime: new Date().toLocaleString(),
            forgotPasswordLink: MailService.FRONTEND_FORGOT_PASSWORD_LINK,
            supportEmail: MailService.FRONTEND_SUPPORT_EMAIL,
            termsLink: MailService.FRONTEND_TERMS_LINK,
            privacyLink: MailService.FRONTEND_PRIVACY_LINK,
        });

        await MailService.sendMail(email, 'New Login Detected', emailContent);
    }


    static async sendForgotPasswordEmail(
        email: string,
        name?: string | null,
        resetToken?: string) {

        const emailContent = await ejs.renderFile(path.join(MailService.TEMPLATE_PATH, 'forgot-password.ejs'), {
            user: { name: name || email },
            appName: MailService.APPLICATION_NAME,
            resetToken: resetToken,
            resetLink: MailService.FRONTEND_URL + MailService.FRONTEND_FORGOT_PASSWORD_PATH + "?token=" + resetToken,
            expiryTime: 1, // Expiry time in hours
            termsLink: MailService.FRONTEND_TERMS_LINK,
            privacyLink: MailService.FRONTEND_PRIVACY_LINK,
            supportEmail: MailService.FRONTEND_SUPPORT_EMAIL,
        });


        await MailService.sendMail(email, 'Reset Your Password', emailContent);
    }

    static async sendPasswordResetSuccessEmail(
        email: string,
        name?: string | null
    ) {

        const emailContent = await ejs.renderFile(path.join(MailService.TEMPLATE_PATH, 'password-reset.ejs'), {
            user: { name: name || email },
            appName: MailService.APPLICATION_NAME,
            loginLink: MailService.FRONTEND_LOGIN_LINK,
            supportEmail: MailService.FRONTEND_SUPPORT_EMAIL,
            termsLink: MailService.FRONTEND_TERMS_LINK,
            privacyLink: MailService.FRONTEND_PRIVACY_LINK,
        });

        await MailService.sendMail(email, 'Password Reset Successful', emailContent);

    }

    static async sendOTPEmail({
        email,
        name,
        otpToken,
    }: {
        email: string;
        name?: string | null;
        otpToken: string;
    }) {

        if (!otpToken) {
            throw new Error("OTP token is required");
        }

        if (!email) {
            throw new Error("Email is required");
        }

        const emailContent = await ejs.renderFile(path.join(MailService.TEMPLATE_PATH, 'otp.ejs'), {
            user: { name: name || email },
            appName: MailService.APPLICATION_NAME,
            loginLink: MailService.FRONTEND_LOGIN_LINK,
            resetPasswordLink: MailService.FRONTEND_RESET_PASSWORD_LINK,
            termsLink: MailService.FRONTEND_TERMS_LINK,
            privacyLink: MailService.FRONTEND_PRIVACY_LINK,
            supportEmail: MailService.FRONTEND_SUPPORT_EMAIL,
            otpToken: otpToken,
        });

        await MailService.sendMail(email, 'Your OTP Code', emailContent);

    }

    static async sendOTPEnabledEmail(email: string, name?: string) {


        const emailContent = await ejs.renderFile(path.join(MailService.TEMPLATE_PATH, 'otp-enabled.ejs'), {
            user: { name: name || email },
            appName: MailService.APPLICATION_NAME,
            loginLink: MailService.FRONTEND_LOGIN_LINK,
            resetPasswordLink: MailService.FRONTEND_RESET_PASSWORD_LINK,
            supportEmail: MailService.FRONTEND_SUPPORT_EMAIL,
            termsLink: MailService.FRONTEND_TERMS_LINK,
            privacyLink: MailService.FRONTEND_PRIVACY_LINK,
        });


        await MailService.sendMail(email, 'OTP Enabled', emailContent);
    }


    static async sendOTPDisabledEmail(email: string, name?: string) {

        const emailContent = await ejs.renderFile(path.join(MailService.TEMPLATE_PATH, 'otp-disabled.ejs'), {
            user: { name: name || email },
            appName: MailService.APPLICATION_NAME,
            loginLink: MailService.FRONTEND_LOGIN_LINK,
            resetPasswordLink: MailService.FRONTEND_RESET_PASSWORD_LINK,
            supportEmail: MailService.FRONTEND_SUPPORT_EMAIL,
            termsLink: MailService.FRONTEND_TERMS_LINK,
            privacyLink: MailService.FRONTEND_PRIVACY_LINK,
        });

        await MailService.sendMail(email, 'OTP Disabled', emailContent);
    }

}
