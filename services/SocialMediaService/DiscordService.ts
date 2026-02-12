import axios from 'axios'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

export default class DiscordService {
  static async sendWebhookMessage(message: string) {
    await axios
      .post(
        DISCORD_WEBHOOK_URL as string,
        {
          content: message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .catch((error) => {
        console.error('Error sending Discord webhook:', error)
      })
  }
}
