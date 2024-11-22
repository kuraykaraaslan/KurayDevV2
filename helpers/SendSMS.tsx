import { Twilio } from "twilio";
import axios from "axios";

import ContactUsSMSTemplate from "./SMSTemplates/ContactUsSMSTemplate";

export default class SendSMS {


  /*
    This function is responsible for Contact Us SMS sending.
    It uses the ContactUsSMSTemplate to generate the message body.
    */

  public static async sendContactUsSMS(
    name: string,
    phone: string,
    language?: string,
  ): Promise<void> {
    if (!phone) {
      return;
    }

    const message = ContactUsSMSTemplate({ name, language });
    await this.MultiVendorSelector(phone, message);
  }


  /* 
    This function is responsible for selecting the SMS provider based on the country code of the phone number.
    If the phone number starts with +90, it is the country code of Turkey then use NETGSM
    If it is other than +90, it is the country code of another country then use TWILIO
    */

  public static async MultiVendorSelector(
    phone: string,
    message: string,
  ): Promise<void> {
    // PHONE_NUMBER is the phone number of the recipient and starts with the country code with plus sign
    // For example, +905555555555
    // if it is +90, it is the country code of Turkey then use NETGSM
    // if it is other than +90, it is the country code of another country then use TWILIO

    if (phone.startsWith("90")) {
      const targetPhone = phone.replace("90", "");
      await this.sendOTPbyNETGSM(phone, message);
    } else {
      const targetPhone = phone;
      await this.sendOTPbyTwillo(phone, message);
    }
  }

  /*
    This function is responsible for sending the OTP code to the user using Twilio.
    It uses the Twilio API to send the SMS.
    */
  
  public static async sendOTPbyTwillo(
    phone: string,
    message: string,
  ): Promise<void> {
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.error("Twilio credentials not found");
      throw new Error("ERROR_SENDING_SMS");
    }

    const client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    await client.messages
      .create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      })
      .then((message) => console.log(message.sid))
      .catch((err) => {
        console.error(err);
        throw new Error("ERROR_SENDING_SMS");
      });
  }

  /*
    This function is responsible for sending the OTP code to the user using NETGSM.
    It uses the NETGSM API to send the SMS.
    */

  public static async sendOTPbyNETGSM(
    phone: string,
    message: string,
  ): Promise<void> {
    if (
      !process.env.NETGSM_USER_CODE ||
      !process.env.NETGSM_SECRET_CODE ||
      !process.env.NETGSM_PHONE_NUMBER
    ) {
      console.error("NETGSM credentials not found");
      throw new Error("ERROR_SENDING_SMS");
    }

    if (!process.env.NETGSM_APP_KEY) {
      console.error("NETGSM APP KEY not found");
      throw new Error("ERROR_SENDING_SMS");
    }

    const formData = new FormData();

    /*
        usercode : 850XXXXXXX
        password : XXXX
        gsmno : 5XXXXXXXXXX
        message : testmesajı
        msgheader : mesajbaşlığı
        filter : 0
        appkey : xxx
        */

    formData.append("usercode", process.env.NETGSM_USER_CODE);
    formData.append("password", process.env.NETGSM_SECRET_CODE);
    formData.append("gsmno", phone);
    formData.append("message", "Your verification code is: " + message);
    formData.append("msgheader", process.env.NETGSM_PHONE_NUMBER);
    formData.append("filter", "0");
    formData.append("appkey", process.env.NETGSM_APP_KEY);

    try {
      await axios
        .post("https://api.netgsm.com.tr/sms/send/get", formData)
        .then((response) => {
        })
        .catch((err) => {
          console.error(err);
          throw new Error("ERROR_SENDING_SMS");
        });
    } catch (error) {
      console.error(error);
      throw new Error("ERROR_SENDING_SMS");
    }
  }
}
