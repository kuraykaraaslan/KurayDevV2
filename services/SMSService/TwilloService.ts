import twillo from "twilio";


export default class TwilloService {
  static client: twillo.Twilio;

  constructor() {
    TwilloService.client = twillo(
      process.env.TWILLO_ACCOUNT_SID as string,
      process.env.TWILLO_AUTH_TOKEN as string
    );

  }

  static async sendShortMessage(to: string, body: string) {
    try {
      const message = await TwilloService.client.messages.create({
        body: body,
        from: process.env.TWILLO_PHONE_NUMBER as string,
        to: to
      });
    } catch (error) {
      console.error("An error occurred while sending the message via Twillo.");
    }
  }
}

