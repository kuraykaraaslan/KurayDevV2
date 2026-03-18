import axios from 'axios'
import DiscordService from '@/services/SocialMediaService/DiscordService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('DiscordService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('sendWebhookMessage', () => {
    it('posts to a URL with correct content and JSON header', async () => {
      axiosMock.post.mockResolvedValueOnce({ status: 204 })

      await DiscordService.sendWebhookMessage('Hello Discord!')

      expect(axiosMock.post).toHaveBeenCalledTimes(1)
      const [, body, opts] = axiosMock.post.mock.calls[0]
      expect(body).toEqual({ content: 'Hello Discord!' })
      expect(opts).toMatchObject({ headers: { 'Content-Type': 'application/json' } })
    })

    it('does not throw when axios.post fails (error caught internally)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      try {
        axiosMock.post.mockRejectedValueOnce(new Error('Discord unreachable'))

        await expect(DiscordService.sendWebhookMessage('Test message')).resolves.not.toThrow()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error sending Discord webhook:',
          expect.any(Error)
        )
      } finally {
        consoleErrorSpy.mockRestore()
      }
    })
  })
})
