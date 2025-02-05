import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { User, Session } from '@prisma/client';

const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;


export default class MailService {

    static TEMPLATE_PATH = path.join(__dirname, '../../../../../../../views/email/');
    static APPLICATION_NAME = process.env.APPLICATION_NAME || "Express Boilerplate";

    // These are the default values, you can change them in the .env file
    static APP_URL = process.env.APP_URL;

    static FRONTEND_LOGIN_PATH = process.env.FRONTEND_LOGIN_PATH || "/auth/login";
    static FRONTEND_REGISTER_PATH = process.env.FRONTEND_REGISTER_PATH || "/auth/register";
    static FRONTEND_PRIVACY_PATH = process.env.FRONTEND_PRIVACY_PATH || "/privacy";
    static FRONTEND_TERMS_PATH = process.env.FRONTEND_TERMS_PATH || "/terms-of-use";
    static FRONTEND_RESET_PASSWORD_PATH = process.env.FRONTEND_RESET_PASSWORD_PATH || "/auth/reset-password";
    static FRONTEND_FORGOT_PASSWORD_PATH = process.env.FRONTEND_FORGOT_PASSWORD_PATH || "/auth/forgot-password";
    static FRONTEND_SUPPORT_EMAIL = process.env.FRONTEND_SUPPORT_EMAIL || "support@example.com";


    //GENERATED LINK : NOT MODIFY
    static FRONTEND_LOGO_LINK = MailService.APP_URL + "/assets/svg/logo/black.svg";
    static FRONTEND_LOGIN_LINK = MailService.APP_URL + MailService.FRONTEND_LOGIN_PATH;
    static FRONTEND_REGISTER_LINK = MailService.APP_URL + MailService.FRONTEND_REGISTER_PATH;
    static FRONTEND_PRIVACY_LINK = MailService.APP_URL + MailService.FRONTEND_PRIVACY_PATH;
    static FRONTEND_TERMS_LINK = MailService.APP_URL + MailService.FRONTEND_TERMS_PATH;
    static FRONTEND_RESET_PASSWORD_LINK = MailService.APP_URL + MailService.FRONTEND_RESET_PASSWORD_PATH;
    static FRONTEND_FORGOT_PASSWORD_LINK = MailService.APP_URL + MailService.FRONTEND_FORGOT_PASSWORD_PATH;



    static transporter = nodemailer.createTransport({
        host: MAIL_HOST,
        port: Number(MAIL_PORT),

        secure: false,
        auth: {
            user: MAIL_USER,
            pass: MAIL_PASS,
        },
    });

    static async sendMail(to: string, subject: string, html: string) {
        try {
            await MailService.transporter.sendMail({
                from: MailService.APPLICATION_NAME + " <" + MAIL_USER + ">",
                to,
                subject,
                html,
            });
        } catch (error: any) {
            console.error("Error sending email: ", error.message);
        }
    };


    static async sendWelcomeEmail(user: User) {

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


    static async sendForgotPasswordEmail(
        email: string, 
        name?: string | null,
        resetToken?: string,
    ) {
        const emailContent = await ejs.renderFile(path.join(MailService.TEMPLATE_PATH, 'forgot-password.ejs'), {
            user: { name: name || email },
            appName: MailService.APPLICATION_NAME,
            resetToken: resetToken,
            resetLink: MailService.APP_URL + MailService.FRONTEND_FORGOT_PASSWORD_PATH + "?token=" + resetToken + "&email=" + email,
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

}
