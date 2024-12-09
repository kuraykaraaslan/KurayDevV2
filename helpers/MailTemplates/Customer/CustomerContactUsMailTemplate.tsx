function CustomerContactUsMailTemplate(props: { email: string, message: string, name: string, phone: string }) : string {
  
  const { email, message, name , phone } = props;
  
  const INFORM_NAME = process.env.INFORM_MAIL as string;
  const INFORM_TITLE = process.env.INFORM_TITLE as string;
  const INFORM_MAIL = process.env.INFORM_MAIL as string;
  const INFORM_PHONE = process.env.INFORM_PHONE as string;

  const mailBody = `
    <div>
        <p>Hi ${name},</p>
        <p>Thank you for contacting us. We have received your message and will get back to you as soon as possible.</p>
        <p>Here is a copy of your message:</p>
        <p>${message}</p>
        <p>Your contact details:</p>
        <p>Email: ${email}</p>
        <p>Phone: ${phone}</p>
        <p>If you have any further questions, please do not hesitate to contact us.</p>
        <p>Best regards,</p>
        <p>Kuray Karaaslan</p>
        <p>Phone: ${INFORM_PHONE}</p>
        <p>Email: ${INFORM_MAIL}</p>
        <p>
    </div>`;
  return mailBody;
}

export default CustomerContactUsMailTemplate;
