function AdminContactUsMailTemplate(props: { email: string, message: string, name: string, phone: string }) : string {
  
  const { email, message, name , phone } = props;
  
  const INFORM_NAME = process.env.INFORM_NAME as string;
  const INFORM_TITLE = process.env.INFORM_TITLE as string;
  const INFORM_MAIL = process.env.INFORM_MAIL as string;
  const INFORM_PHONE = process.env.INFORM_PHONE as string;

  const mailBody = `
    <div>
        <p>Hi ${INFORM_NAME},</p>
        <p>A new message has been received from the contact form.</p>
        <p>Here is a copy of the message:</p>
        <p>${message}</p>
        <br>
        <p>Contact details:</p>
        <p>Name: ${name}</p>
        <p>Email: ${email}</p>
        <p>Phone: ${phone}</p>
        <p>Best regards,</p>
        <br>
        <p>${INFORM_TITLE}</p>
        <p>Phone: ${INFORM_PHONE}</p>
        <p>Email: ${INFORM_MAIL}</p>
        <p>
    </div>`;
  return mailBody;
}

export default AdminContactUsMailTemplate;