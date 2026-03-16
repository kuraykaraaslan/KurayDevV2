jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({ add: jest.fn().mockResolvedValue({}) })),
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
}))

jest.mock('ejs', () => ({
  renderFile: jest.fn().mockResolvedValue('<html>mock</html>'),
}))

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}))

import MailService from '@/services/NotificationService/MailService'
import ejs from 'ejs'
import nodemailer from 'nodemailer'
import CampaignMessages from '@/messages/CampaignMessages'

const ejsMock = ejs as jest.Mocked<typeof ejs>
const transporterMock = (nodemailer.createTransport as jest.Mock).mock.results[0]?.value

describe('MailService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getBaseTemplateVars ───────────────────────────────────────────────
  describe('getBaseTemplateVars', () => {
    it('returns an object with required URL fields', () => {
      const vars = MailService.getBaseTemplateVars()
      expect(vars).toHaveProperty('appName')
      expect(vars).toHaveProperty('loginLink')
      expect(vars).toHaveProperty('supportEmail')
      expect(vars).toHaveProperty('termsLink')
      expect(vars).toHaveProperty('privacyLink')
    })
  })

  // ── sendMail (queue) ──────────────────────────────────────────────────
  describe('sendMail', () => {
    it('adds job to the queue without throwing', async () => {
      await expect(
        MailService.sendMail('test@example.com', 'Subject', '<p>body</p>')
      ).resolves.not.toThrow()
      expect(MailService.QUEUE.add).toHaveBeenCalledWith(
        'sendMail',
        expect.objectContaining({ to: 'test@example.com', subject: 'Subject' })
      )
    })
  })

  // ── _sendMail (transporter) ───────────────────────────────────────────
  describe('_sendMail', () => {
    it('calls transporter.sendMail with correct fields', async () => {
      const transporterSendMail = MailService.transporter.sendMail as jest.Mock
      transporterSendMail.mockResolvedValueOnce({ messageId: 'x' })

      await MailService._sendMail('to@example.com', 'Subj', '<p>html</p>')

      expect(transporterSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'to@example.com',
          subject: 'Subj',
          html: '<p>html</p>',
        })
      )
    })

    it('does not throw when transporter fails (logs error internally)', async () => {
      const transporterSendMail = MailService.transporter.sendMail as jest.Mock
      transporterSendMail.mockRejectedValueOnce(new Error('SMTP error'))

      await expect(
        MailService._sendMail('fail@example.com', 'Subj', '<p>x</p>')
      ).resolves.not.toThrow()
    })
  })

  // ── renderTemplate ────────────────────────────────────────────────────
  describe('renderTemplate', () => {
    it('calls ejs.renderFile 4 times (template + header + footer + layout)', async () => {
      await MailService.renderTemplate('welcome.ejs', { user: { name: 'Test' } })
      expect(ejsMock.renderFile).toHaveBeenCalledTimes(4)
    })

    it('passes data to template renderer', async () => {
      await MailService.renderTemplate('otp.ejs', { otpToken: '123456' })
      expect(ejsMock.renderFile).toHaveBeenCalledWith(
        expect.stringContaining('otp.ejs'),
        expect.objectContaining({ otpToken: '123456' }),
        expect.any(Object)
      )
    })
  })

  // ── sendOTPEmail ──────────────────────────────────────────────────────
  describe('sendOTPEmail', () => {
    it('throws when otpToken is missing', async () => {
      await expect(
        MailService.sendOTPEmail({ email: 'u@ex.com', otpToken: '' })
      ).rejects.toThrow('OTP token is required')
    })

    it('queues OTP email when token is provided', async () => {
      const spy = jest.spyOn(MailService, 'sendMail').mockResolvedValue()
      await MailService.sendOTPEmail({ email: 'u@ex.com', otpToken: '654321' })
      expect(spy).toHaveBeenCalledWith('u@ex.com', expect.any(String), expect.any(String))
    })
  })

  // ── sendForgotPasswordEmail ───────────────────────────────────────────
  describe('sendForgotPasswordEmail', () => {
    it('includes resetToken in the link passed to template', async () => {
      const spy = jest.spyOn(MailService, 'sendMail').mockResolvedValue()
      await MailService.sendForgotPasswordEmail('u@ex.com', 'User', 'mytoken123')
      expect(spy).toHaveBeenCalledWith('u@ex.com', expect.any(String), expect.any(String))
      // ejs.renderFile should be called with resetToken
      expect(ejsMock.renderFile).toHaveBeenCalledWith(
        expect.stringContaining('forgot_password.ejs'),
        expect.objectContaining({ resetToken: 'mytoken123' }),
        expect.any(Object)
      )
    })
  })

  // ── sendContactFormAdminEmail ─────────────────────────────────────────
  describe('sendContactFormAdminEmail', () => {
    it('skips sending when INFORM_MAIL is not set', async () => {
      const original = MailService.INFORM_MAIL
      ;(MailService as any).INFORM_MAIL = undefined
      const spy = jest.spyOn(MailService, 'sendMail').mockResolvedValue()

      await MailService.sendContactFormAdminEmail({ message: 'hi', name: 'N', email: 'e@x.com', phone: '1' })

      expect(spy).not.toHaveBeenCalled()
      ;(MailService as any).INFORM_MAIL = original
    })

    it('sends to INFORM_MAIL when configured', async () => {
      ;(MailService as any).INFORM_MAIL = 'admin@example.com'
      const spy = jest.spyOn(MailService, 'sendMail').mockResolvedValue()

      await MailService.sendContactFormAdminEmail({ message: 'hi', name: 'N', email: 'e@x.com', phone: '1' })

      expect(spy).toHaveBeenCalledWith('admin@example.com', expect.any(String), expect.any(String))
      ;(MailService as any).INFORM_MAIL = undefined
    })
  })

  // ── sendCampaignEmail ─────────────────────────────────────────────────
  describe('sendCampaignEmail', () => {
    it('throws when unsubscribeToken is missing', async () => {
      await expect(
        MailService.sendCampaignEmail('sub@ex.com', 'Promo', '<p>content</p>', '')
      ).rejects.toThrow(CampaignMessages.UNSUBSCRIBE_TOKEN_REQUIRED)
    })

    it('throws when subject is blank', async () => {
      await expect(
        MailService.sendCampaignEmail('sub@ex.com', '   ', '<p>content</p>', 'token-xyz')
      ).rejects.toThrow(CampaignMessages.SUBJECT_REQUIRED)
    })

    it('throws when body content is blank', async () => {
      await expect(
        MailService.sendCampaignEmail('sub@ex.com', 'Promo', '   ', 'token-xyz')
      ).rejects.toThrow(CampaignMessages.CONTENT_REQUIRED)
    })

    it('queues campaign email with unsubscribeToken in template data', async () => {
      const spy = jest.spyOn(MailService, 'sendMail').mockResolvedValue()
      await MailService.sendCampaignEmail('sub@ex.com', 'Promo', '<p>content</p>', 'token-xyz')
      expect(spy).toHaveBeenCalledWith('sub@ex.com', 'Promo', expect.any(String))
      expect(ejsMock.renderFile).toHaveBeenCalledWith(
        expect.stringContaining('campaign.ejs'),
        expect.objectContaining({ unsubscribeToken: 'token-xyz' }),
        expect.any(Object)
      )
    })
  })
})
