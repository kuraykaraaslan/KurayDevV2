import axios from "axios";

export default class NetGSMService {

    static async sendShortMessage(to: string, body: string) {

        const formData = new FormData();

        formData.append("usercode", process.env.NETGSM_USER_CODE as string);
        formData.append("password", process.env.NETGSM_SECRET_CODE as string);
        formData.append("gsmno", to);
        formData.append("message", body);
        formData.append("msgheader", process.env.NETGSM_PHONE_NUMBER as string);
        formData.append("filter", "0");
        formData.append("appkey", process.env.NETGSM_APP_KEY as string);

        try {
            await axios
                .post("https://api.netgsm.com.tr/sms/send/get", formData)
                .then((response) => {
                    console.log(response.data);
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