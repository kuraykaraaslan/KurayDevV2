import { Twilio } from "twilio";


export class TwilloService {
  static twilio: Twilio;

  constructor() {
    TwilloService.twilio = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  static async sendShortMessage(to: string, body: string) {
    try {
      await this.twilio.messages.create({
        to,
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
    } catch (error) {
      console.error(error);
    }
  }
}

