const ContactUsMailTemplate = (props: { name: string, email: string; message: string , language?: string }) => {
  const { email, message, name } = props;

  if (!email || !message) {
    return;
  }

  const mailBody = `<div>
        <p>Hi ${name},</p>
        <p>Thank you for contacting us. We have received your message and will get back to you as soon as possible.</p>
        <p>Here is a copy of your message:</p>
        <p>${message}</p>
        <p>Best regards,</p>
        <p>Kuray Karaaslan</p>
    </div>`;
  return mailBody;
}

export default ContactUsMailTemplate;
