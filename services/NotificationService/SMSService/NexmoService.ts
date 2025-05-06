import BaseProvider from './BaseProvider';
import axios, { AxiosInstance } from 'axios';
import qs from 'qs';
import Logger from '@/libs/logger';

export default class NexmoService extends BaseProvider {
  private static readonly NEXMO_API_KEY = process.env.NEXMO_API_KEY!;
  private static readonly NEXMO_API_SECRET = process.env.NEXMO_API_SECRET!;
  private static readonly NEXMO_PHONE_NUMBER = process.env.NEXMO_PHONE_NUMBER!;
  private static readonly NEXMO_BASE_URL = 'https://rest.nexmo.com/sms/json';

  private static readonly axiosInstance: AxiosInstance = axios.create({
    baseURL: NexmoService.NEXMO_BASE_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  static async sendShortMessage(to: string, body: string): Promise<void> {
    if (!this.NEXMO_API_KEY || !this.NEXMO_API_SECRET || !this.NEXMO_PHONE_NUMBER) {
      Logger.error('Nexmo credentials are not set.');
      return;
    }

    if (!to || !body) {
      Logger.info('Missing phone number or message body.');
      return;
    }

    const payload = qs.stringify({
      api_key: this.NEXMO_API_KEY,
      api_secret: this.NEXMO_API_SECRET,
      to,
      from: this.NEXMO_PHONE_NUMBER,
      text: body,
    });

    this.axiosInstance
      .post('', payload)
      .then((response) => {
        const messages = response.data?.messages;
        const message = messages?.[0];
        if (message && message.status === '0') {
          Logger.info(`Message sent successfully to ${to}`);
        } else {
          Logger.error(`Nexmo error to ${to}: ${message?.['error-text'] || 'Unknown error'}`);
        }
      })
      .catch((error) => {
        const message = error?.response?.data?.message || error.message;
        Logger.error(`Nexmo SMS error to ${to}: ${message}`);
      });
  }
}
