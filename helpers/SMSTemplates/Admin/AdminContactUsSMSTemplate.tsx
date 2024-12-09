const AdminContactUsSMSTemplate = (props: { name?: string, language?: string }) => {
  const { name } = props;

  if (!name) {
    return "Someone contacted you. Please check your email.";
  }

  
  const INFORM_NAME = process.env.INFORM_NAME as string;
  const INFORM_TITLE = process.env.INFORM_TITLE as string;
  const INFORM_MAIL = process.env.INFORM_MAIL as string;
  const INFORM_PHONE = process.env.INFORM_PHONE as string;

  const smsBody = `Hi ${INFORM_NAME}, ${name} contacted you. Please check your email. `;

  return smsBody;
}

export default AdminContactUsSMSTemplate;