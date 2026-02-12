import BaseProvider from './BaseProvider'
import axios, { AxiosInstance } from 'axios'
import qs from 'qs'
import Logger from '@/libs/logger'

export default class TwilloService extends BaseProvider {
  private static readonly TWILLO_ACCOUNT_SID = process.env.TWILLO_ACCOUNT_SID!
  private static readonly TWILLO_AUTH_TOKEN = process.env.TWILLO_AUTH_TOKEN!
  private static readonly TWILLO_PHONE_NUMBER = process.env.TWILLO_PHONE_NUMBER!
  private static readonly TWILLO_BASE_URL = `https://api.twilio.com/2010-04-01/Accounts/${TwilloService.TWILLO_ACCOUNT_SID}`

  private static readonly axiosInstance: AxiosInstance = axios.create({
    baseURL: TwilloService.TWILLO_BASE_URL,
    auth: {
      username: TwilloService.TWILLO_ACCOUNT_SID,
      password: TwilloService.TWILLO_AUTH_TOKEN,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  static async sendShortMessage(to: string, body: string): Promise<void> {
    if (!this.TWILLO_ACCOUNT_SID || !this.TWILLO_AUTH_TOKEN || !this.TWILLO_PHONE_NUMBER) {
      Logger.error('Twilio credentials are not set.')
      return
    }

    if (!to || !body) {
      Logger.info('Missing phone number or message body.')
      return
    }

    const payload = qs.stringify({
      From: this.TWILLO_PHONE_NUMBER,
      To: to,
      Body: body,
    })

    this.axiosInstance
      .post('/Messages.json', payload)
      .then((response) => {
        if (response.status === 201) {
          Logger.info(`Message sent successfully to ${to}`)
        } else {
          Logger.error(`Unexpected Twilio response status: ${response.status} for ${to}`)
        }
      })
      .catch((error) => {
        const message = error?.response?.data?.message || error.message
        Logger.error(`Twilio SMS error to ${to}: ${message}`)
      })
  }
}
