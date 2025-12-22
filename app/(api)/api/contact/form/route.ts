
import { NextRequest, NextResponse } from 'next/server';
import DiscordService from '@/services/SocialMediaService/DiscordService';
import ContactFormService from '@/services/ContactFormService';
import MailService from '@/services/NotificationService/MailService';
import SMSService from '@/services/NotificationService/SMSService';
import { ContactFormRequestSchema } from '@/dtos/AIAndServicesDTO';
import ContactMessages from '@/messages/ContactMessages';

type ResponseData = {
    message: string;
};


export async function POST(request: NextRequest, _response: NextResponse<ResponseData>) {

    const body = await request.json();
    
    const parsedData = ContactFormRequestSchema.safeParse(body);
    
    if (!parsedData.success) {
        return NextResponse.json({
            message: parsedData.error.errors.map(err => err.message).join(", ")
        }, { status: 400 });
    }

    const { name, email, phone, message } = parsedData.data;

    //find recent contact form entries
    const recentEntries = await ContactFormService.getRecentContactFormEntriesByPhoneOrEmail(phone, email);

    if (recentEntries.length > 2) {
        return NextResponse.json({ message: "You have already submitted a message recently. Please wait before sending another message." }, { status: 429 });
    }

    try {
        const data = {
            name: name,
            email: email,
            phone: phone,
            message: message
        };

        await ContactFormService.createContactForm(data);

    } catch (error) { console.error(error); }


    try { await MailService.sendContactFormAdminEmail({ name, email, phone, message }); } catch (error) { console.error(error); }

    try { await MailService.sendContactFormUserEmail({ name, email }); } catch (error) { console.error(error); }

    try {
        const discordMessage = `A new message has been received from the contact form.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`;
        await DiscordService.sendWebhookMessage(discordMessage);
    } catch (error) { console.error(error); }

    try {

        const userSMSBody = `Hi ${name},\n\n` +
            `Thank you for reaching out to us. We have received your message and will get back to you shortly.\n\n` +
            `Best regards,\n` +
            `Kuray Karaaslan`

        await SMSService.sendShortMessage({ to: phone, body: userSMSBody });

    } catch (error) { console.error(error); }

    return NextResponse.json({ message: "Your message has been sent successfully." });
}


