import axios from "axios";

export default class NetGSMService {

    static async sendShortMessage(to: string, body: string) {

        const formData = new FormData();

        formData.append("usercode", process.env.NETGSM_USER_CODE as string);
        formData.append("password", process.env.NETGSM_PASSWORD as string);
        formData.append("gsmno", to);
        formData.append("message", body);
        formData.append("msgheader", process.env.NETGSM_PHONE_NUMBER as string);
        formData.append("filter", "0");

        await axios
            .post("https://api.netgsm.com.tr/sms/send/get", formData)
            .then((response) => {
                const data = response.data;

                /*            
                Kod	Anlamı
                00	Görevinizin tarih formatinda bir hata olmadığını gösterir.
                01	Mesaj gönderim başlangıç tarihinde hata var. Sistem tarihi ile değiştirilip işleme alındı.
                02	Mesaj gönderim sonlandırılma tarihinde hata var.Sistem tarihi ile değiştirilip işleme alındı.Bitiş tarihi başlangıç tarihinden küçük girilmiş ise, sistem bitiş tarihine içinde bulunduğu tarihe 24 saat ekler.
                347022009	Gönderdiğiniz SMS'inizin başarıyla sistemimize ulaştığını gösterir. Bu görevid niz ile mesajınızın durumunu sorguyabilirsiniz.
                00 5Fxxxxxx-2xxx-4xxE-8xxx-8A5xxxxxxxxxxxx	Gönderdiğiniz SMS'inizin başarıyla sistemimize ulaştığını gösterir. Bu görev(bulkid) sorgulanabilir, Raporlama servisinde bulkID bilgisi olarak 5Fxxxxxx-2xxx-4xxE-8xxx-8A5xxxxxxxxxxxx verilebilir. Bu outputu almanızın sebebi, 5 dakika boyunca ard arda gönderdiğiniz SMS'lerin sistemimiz tarafında çoklanarak (biriktirilerek) 1 dakika içerisinde gönderileceği anlamına gelir.
                */
                if (data.status === "00") {
                    console.log("Message sent successfully.");
                } else {
                    throw new Error("An error occurred while sending the message.");
                    console.error("An error occurred while sending the message.");
                }
            })

    }
}