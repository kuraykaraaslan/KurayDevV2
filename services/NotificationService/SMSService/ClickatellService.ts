import BaseProvider from './BaseProvider';
import axios, { AxiosInstance } from 'axios';
import Logger from '@/libs/logger';

export default class ClickatellService extends BaseProvider {
  private static readonly CLICKATELL_API_KEY = process.env.CLICKATELL_API_KEY!;
  private static readonly CLICKATELL_PHONE_NUMBER = process.env.CLICKATELL_PHONE_NUMBER!;
  private static readonly CLICKATELL_BASE_URL = 'https://platform.clickatell.com/messages';

  private static readonly axiosInstance: AxiosInstance = axios.create({
    baseURL: ClickatellService.CLICKATELL_BASE_URL,
    headers: {
      Authorization: `Bearer ${ClickatellService.CLICKATELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  static async sendShortMessage(to: string, body: string): Promise<void> {
    if (!this.CLICKATELL_API_KEY || !this.CLICKATELL_PHONE_NUMBER) {
      Logger.error('Clickatell credentials are not set.');
      return;
    }

    if (!to || !body) {
      Logger.info('Missing phone number or message body.');
      return;
    }

    const payload = {
      content: body,
      to: [to],
    };

    this.axiosInstance
      .post('/chat', payload)
      .then((response) => {
        if (response.status === 202) {
          Logger.info(`Clickatell: Message accepted for delivery to ${to}`);
        } else {
          Logger.error(`Clickatell: Unexpected response status ${response.status} for ${to}`);
        }
      })
      .catch((error) => {
        const message = error?.response?.data?.error || error.message;
        Logger.error(`Clickatell SMS error to ${to}: ${message}`);
      });
  }
}
