const ContactUsSMSTemplate = (props: { name?: string, language?: string }) => {
  const { name } = props;

  if (!name) {
    return 'Hi, thank you for contacting me. I will get back to you as soon as possible.';
  }

  const smsBody = `Hi ${name}, thank you for contacting me. I will get back to you as soon as possible.`;

  return smsBody;
}

export default ContactUsSMSTemplate;