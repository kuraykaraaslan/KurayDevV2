import BaseProvider from './BaseProvider'
import axios, { AxiosInstance } from 'axios'
import Logger from '@/libs/logger'
import FormData from 'form-data'

export default class NetGSMService extends BaseProvider {
  private static readonly NETGSM_USER_CODE = process.env.NETGSM_USER_CODE!
  private static readonly NETGSM_PASSWORD = process.env.NETGSM_PASSWORD!
  private static readonly NETGSM_PHONE_NUMBER = process.env.NETGSM_PHONE_NUMBER!
  private static readonly NETGSM_BASE_URL = 'https://api.netgsm.com.tr/sms/send/get'

  private static readonly axiosInstance: AxiosInstance = axios.create({
    baseURL: NetGSMService.NETGSM_BASE_URL,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  static async sendShortMessage(to: string, body: string): Promise<void> {
    if (!this.NETGSM_USER_CODE || !this.NETGSM_PASSWORD || !this.NETGSM_PHONE_NUMBER) {
      Logger.error('NetGSM credentials are not set.')
      return
    }

    if (!to?.trim() || !body?.trim()) {
      Logger.info('Missing phone number or message body.')
      return
    }

    const formData = new FormData()
    formData.append('usercode', this.NETGSM_USER_CODE)
    formData.append('password', this.NETGSM_PASSWORD)
    formData.append('gsmno', to)
    formData.append('message', body)
    formData.append('msgheader', this.NETGSM_PHONE_NUMBER)
    formData.append('filter', '0')

    this.axiosInstance
      .post('', formData, { headers: formData.getHeaders?.() || {} })
      .then((response) => {
        const data = response.data

        if (typeof data === 'string' && (data.startsWith('00') || /^\d{9,}$/.test(data))) {
          Logger.info(`NetGSM: Message sent successfully to ${to}. Response: ${data}`)
        } else {
          Logger.error(`NetGSM: Failed to send message to ${to}. Response: ${data}`)
        }
      })
      .catch((error) => {
        const message = error?.response?.data || error.message
        Logger.error(`NetGSM error sending to ${to}: ${message}`)
      })
  }
}
