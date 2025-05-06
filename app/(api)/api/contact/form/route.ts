"use server";
import { NextRequest, NextResponse } from 'next/server';
import DiscordService from '@/services/SocialMedia/DiscordService';
import ContactFormService from '@/services/ContactFormService';
import MailService from '@/services/NotificationService/MailService';
import SMSService from '@/services/NotificationService/SMSService';

import AdminContactUsMailTemplate from '@/helpers/MailTemplates/Admin/AdminContactUsMailTemplate';
import CustomerContactUsMailTemplate from '@/helpers/MailTemplates/Customer/CustomerContactUsMailTemplate';

import AdminContactUsSMSTemplate from '@/helpers/SMSTemplates/Admin/AdminContactUsSMSTemplate';
import CustomerContactUsSMSTemplate from '@/helpers/SMSTemplates/Customer/CustomerContactUsSMSTemplate';

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

    //find recent contact form entries
    const recentEntries = await ContactFormService.getRecentContactFormEntriesByPhoneOrEmail(phone, email);

    try {
        const data = {
            name: name,
            email: email,
            phone: phone,
            message: message
        };

        await ContactFormService.createContactForm(data);
    } catch (error) { console.error(error); }

    try {
        const adminMailBody = AdminContactUsMailTemplate({ name, email, message, phone });
        await MailService.sendMail(INFORM_MAIL, "Contact Form Message", adminMailBody);
    } catch (error) { console.error(error); }

    try {
        const customerMailBody = CustomerContactUsMailTemplate({ name, email, message, phone });
        await MailService.sendMail(email, "Contact Form Message", customerMailBody);
    } catch (error) { console.error(error); }


    try {
        const discordMessage = `A new message has been received from the contact form.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`;
        await DiscordService.sendWebhookMessage(discordMessage);
    } catch (error) { console.error(error); }

    try {
        const customerSMSBody = CustomerContactUsSMSTemplate({ name });

        if (recentEntries.length === 0) {
            // Send SMS to customer if user not contacted recently 
            await SMSService.sendShortMessage({ to: phone, body: customerSMSBody });
        } 

    } catch (error) { console.error(error); }

    try {
        const adminSMSBody = AdminContactUsSMSTemplate({ name });
        if (recentEntries.length === 0) {
            // Send SMS to admin if user not contacted recently
            await SMSService.sendShortMessage({ to: INFORM_PHONE, body: adminSMSBody });
        }
        
        
    } catch (error) { console.error(error); }

    return NextResponse.json({ message: "Your message has been sent successfully." });
}


