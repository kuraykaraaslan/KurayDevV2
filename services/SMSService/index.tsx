import NetGSMService from "./NetGSMService";
import { TwilloService } from "./TwilloService";

export default class SMSService {
    constructor() {
    }

    static async sendShortMessage(to: string, body: string) {
       //check if number starts with +90
        if (to.startsWith("+90")) {
            await NetGSMService.sendShortMessage(to, body);
        } else {
            await TwilloService.sendShortMessage(to, body);
        }
    }

}  