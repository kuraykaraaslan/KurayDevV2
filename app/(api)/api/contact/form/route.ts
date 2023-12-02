"use server";
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import DiscordService from '@/services/SocialMedia/DiscordService';
import ContactFormService from '@/services/ContactFormService';
import MailService from '@/services/MailService';
import SMSService from '@/services/SMSService';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

type ResponseData = {
    message: string;
};


export async function POST(req: NextRequest, res: NextResponse<ResponseData>) {

    const { name, email, phone, message } = await req.json();

    if (!name || !email || !phone || !message) {
        return NextResponse.json({ message: "Please fill in the required fields." }, { status: 400 });
    }

    const INFORM_NAME = process.env.INFORM_MAIL as string;
    const INFORM_TITLE = process.env.INFORM_TITLE as string;
    const INFORM_MAIL = process.env.INFORM_MAIL as string;
    const INFORM_PHONE = process.env.INFORM_PHONE as string;

    const signature = `
    <br>
    <br>
    <p>Best Regards,</p>
    <p>${INFORM_NAME}</p>
    <p>${INFORM_TITLE}</p>
    <p>${INFORM_MAIL}</p>
    <p>${INFORM_PHONE}</p>
    `;

    const data = {
        name: name,
        email: email,
        phone: phone,
        message: message
    };

    const informMailBody = `
    <h1>New Contact Form Submission</h1>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Message:</strong> ${message}</p>
    `;

    const informSMSBody = `
    New Contact Form Submission Check your email for more details.
    `;
    
    const customerMailBody = `
    <h1>Thank you for contacting us!</h1>
    <p>We will get back to you as soon as possible.</p>
    ${signature}
    `;

    const customerSMSBody = `
    Thank you for contacting us! We will get back to you as soon as possible. ${INFORM_NAME}
    `;

    

    try {
        // Saving the contact form to the database
        const contactForm = await ContactFormService.createContactForm(data);

        // Sending an email to the admin
        await MailService.sendMail(
            process.env.INFORM_MAIL as string,
            "New Contact Form Submission",
            informMailBody
        );

        // Sending an email to the customer
        await MailService.sendMail(
            email,
            "Thank you for contacting us!",
            customerMailBody
        );

        // Sending admin notification to Discord
        await DiscordService.sendWebhookMessage(informMailBody);

        // Sending an SMS to the admin
        await SMSService.sendShortMessage(process.env.INFORM_PHONE as string, informMailBody);

        return NextResponse.json({ message: "message sent successfully" });
    }

    catch (error) {
        console.error(error);
        return NextResponse.json({ message: "An error occurred while sending the message." }, { status: 500 });
    }

}




