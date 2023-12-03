const MAIL_HOST = process.env.MAIL_HOST;
const MAIL_PORT = parseInt(process.env.MAIL_PORT || '587', 10);
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;

import nodemailer from 'nodemailer';

export default class MailService {

    static transporter = nodemailer.createTransport({
        host: MAIL_HOST as string,
        port: MAIL_PORT as number,
        secure: false,
        auth: {
            user: MAIL_USER,
            pass: MAIL_PASS,
        },
    });


    static async sendMail(to: string, subject: string, text: string) {

        const info = await this.transporter.sendMail({
            from: MAIL_USER,
            to,
            subject,
            html: text,
        });

        console.log(`Message sent: ${info.messageId}`);
    }

}