import twillo from "twilio";


export default class TwilloService {
  static client: twillo.Twilio;

  constructor() {
    console.log("TwilloService initialized.");
    console.log("Account SID: ", process.env.TWILLO_ACCOUNT_SID);
    console.log("Auth Token: ", process.env.TWILLO_AUTH_TOKEN);

    TwilloService.client = twillo(
      process.env.TWILLO_ACCOUNT_SID as string,
      process.env.TWILLO_AUTH_TOKEN as string
    );

  }

  static async sendShortMessage(to: string, body: string) {
    try {
      console.log("Sending message via Twillo.");
      console.log("To: ", to);
      console.log("Body: ", body);
      console.log("From: ", process.env.TWILLO_PHONE_NUMBER);
      console.log("Account SID: ", process.env.TWILLO_ACCOUNT_SID);
      console.log("Auth Token: ", process.env.TWILLO_AUTH_TOKEN);
      const message = await TwilloService.client.messages.create({
        body: body,
        from: process.env.TWILLO_PHONE_NUMBER as string,
        to: to
      });

      console.log(message);
    } catch (error) {
      console.error("An error occurred while sending the message via Twillo.");
    }
  }
}

