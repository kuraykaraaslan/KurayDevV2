import nodemailer from "nodemailer";

import ContactUsMailTemplate from "./MailTemplates/ContactUsMailTemplate";

export default class SendMail {
  private static transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: Number(process.env.NODEMAILER_PORT),
    secure: false,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  /**
   * Send an email to the contact email address with the contact form submission.
   * @param name - The name of the user
   * @param email - The email of the user
   * @param message - The message from the user
   * @param language - The language of the email
   */
  static async sendContactUsMail(
    name: string,
    email: string,
    message: string,
    language?: string,
  ): Promise<void> {
    try {
      const mailBody = ContactUsMailTemplate({ name, email, message , language });

      await SendMail.transporter.sendMail({
        from: process.env.NODEMAILER_USER,
        to: process.env.CONTACT_EMAIL,
        subject: "Contact Us Form Submission",
        html: mailBody,
      });

    } catch (error: any) {
      console.error("Error sending email to " + email + ": " + message, error);
    }
  }
}
