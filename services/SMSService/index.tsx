import NetGSMService from "./NetGSMService";
import TwilloService from "./TwilloService";

export default class SMSService {
    constructor() {
    }

    static async sendShortMessage(to: string, body: string) {
       //check if number starts with +90
        if (to.startsWith("+90")) {
            try {
                await NetGSMService.sendShortMessage(to, body);
            } catch (error) {
                console.error("An error occurred while sending the message via NetGSM. Trying to send via Twillo.");
                await TwilloService.sendShortMessage(to, body);
            }
        } else {
            await TwilloService.sendShortMessage(to, body);
        }
    }

}  