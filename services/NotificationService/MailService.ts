import Logger from '@/libs/logger'
import nodemailer from 'nodemailer'
import ejs from 'ejs'
import path from 'path'
import { Queue, Worker } from 'bullmq'
import redisInstance from '@/libs/redis'
import { UserAgentData } from '@/types/user/UserSessionTypes'
import { PostWithData } from '@/types/content/BlogTypes'
import { Stat } from '@/types/common/StatTypes'

// Types
import { User, SafeUser } from '@/types/user/UserTypes'
import { SafeUserSession } from '@/types/user/UserSessionTypes'
import { Appointment } from '@/types/features/CalendarTypes'

const pwd = process.env.PWD || process.cwd()

export default class MailService {
  static _initialized = false

  // Queue + Worker
  static readonly QUEUE_NAME = 'mailQueue'

  static readonly QUEUE = new Queue(MailService.QUEUE_NAME, {
    connection: redisInstance,
  })

  static readonly WORKER = new Worker(
    MailService.QUEUE_NAME,
    async (job) => {
      const { to, subject, html } = job.data
      Logger.info(`MAIL Worker processing job ${job.id}...`)
      await MailService._sendMail(to, subject, html)
    },
    { connection: redisInstance, concurrency: 5 }
  )

  static {
    if (!MailService._initialized) {
      MailService.WORKER.on('completed', (job) => {
        Logger.info(`MAIL Worker completed job ${job.id}`)
      })

      MailService.WORKER.on('failed', (job, err) => {
        Logger.error(`MAIL Worker failed job ${job?.id ?? 'unknown'}: ${err.message}`)
      })

      MailService._initialized = true
    }
  }

  // -----------------------------
  //   MAIL CONFIGURATION
  // -----------------------------

  static readonly MAIL_HOST = process.env.MAIL_HOST || 'smtp.example.com'
  static readonly MAIL_PORT = process.env.MAIL_PORT || '587'
  static readonly MAIL_USER = process.env.MAIL_USER || 'example@example.com'
  static readonly MAIL_PASS = process.env.MAIL_PASS || 'password'

  // TEMPLATE PATHS
  static readonly TEMPLATE_PATH = path.join(pwd, 'views', 'email')

  static readonly APPLICATION_NAME =
    process.env.NEXT_PUBLIC_APPLICATION_NAME || 'Express Boilerplate'
  static readonly APPLICATION_HOST =
    process.env.NEXT_PUBLIC_APPLICATION_HOST || 'http://localhost:3000'

  static readonly FRONTEND_URL = MailService.APPLICATION_HOST
  static readonly FRONTEND_LOGIN_PATH = process.env.FRONTEND_LOGIN_PATH || '/auth/login'
  static readonly FRONTEND_REGISTER_PATH = process.env.FRONTEND_REGISTER_PATH || '/auth/register'
  static readonly FRONTEND_PRIVACY_PATH = process.env.FRONTEND_PRIVACY_PATH || '/privacy'
  static readonly FRONTEND_TERMS_PATH = process.env.FRONTEND_TERMS_PATH || '/terms-of-use'
  static readonly FRONTEND_RESET_PASSWORD_PATH =
    process.env.FRONTEND_RESET_PASSWORD_PATH || '/auth/reset-password'
  static readonly FRONTEND_FORGOT_PASSWORD_PATH =
    process.env.FRONTEND_FORGOT_PASSWORD_PATH || '/auth/forgot-password'
  static readonly FRONTEND_SUPPORT_EMAIL =
    process.env.FRONTEND_SUPPORT_EMAIL || 'support@example.com'

  // Admin notify
  static readonly INFORM_MAIL = process.env.INFORM_MAIL
  static readonly INFORM_NAME = process.env.INFORM_NAME

  // Base template vars
  static getBaseTemplateVars() {
    return {
      appName: MailService.APPLICATION_NAME,
      frontendUrl: MailService.FRONTEND_URL,
      loginLink: MailService.FRONTEND_URL + MailService.FRONTEND_LOGIN_PATH,
      resetPasswordLink: MailService.FRONTEND_URL + MailService.FRONTEND_RESET_PASSWORD_PATH,
      forgotPasswordLink: MailService.FRONTEND_URL + MailService.FRONTEND_FORGOT_PASSWORD_PATH,
      termsLink: MailService.FRONTEND_URL + MailService.FRONTEND_TERMS_PATH,
      privacyLink: MailService.FRONTEND_URL + MailService.FRONTEND_PRIVACY_PATH,
      supportEmail: MailService.FRONTEND_SUPPORT_EMAIL,
      secureAccountLink: MailService.FRONTEND_URL + MailService.FRONTEND_RESET_PASSWORD_PATH,
    }
  }

  // Nodemailer transporter
  static readonly transporter = nodemailer.createTransport({
    host: MailService.MAIL_HOST,
    port: Number(MailService.MAIL_PORT),
    secure: Number(MailService.MAIL_PORT) === 465,
    auth: { user: MailService.MAIL_USER, pass: MailService.MAIL_PASS },
  })

  // Add job to queue
  static async sendMail(to: string, subject: string, html: string) {
    try {
      await MailService.QUEUE.add('sendMail', { to, subject, html })
    } catch (error: any) {
      Logger.error(`MAIL sendMail ERROR: ${to} ${subject} ${error.message}`)
    }
  }

  // Worker actual mail sender
  static async _sendMail(to: string, subject: string, html: string) {
    try {
      await MailService.transporter.sendMail({
        from: `${MailService.APPLICATION_NAME} <${MailService.MAIL_USER}>`,
        to,
        subject,
        html,
      })
    } catch (error: any) {
      Logger.error(`MAIL _sendMail ERROR: ${to} ${subject} ${error.message}`)
    }
  }

  // -----------------------------
  //   EJS LAYOUT ENGINE
  // -----------------------------

  static async renderTemplate(templateName: string, data: any) {
    const templatePath = path.join(MailService.TEMPLATE_PATH, templateName)

    // 1) Render the main email content (the 'body')
    const body = await ejs.renderFile(templatePath, data, { async: true })

    // 2) Render the header and footer partials asynchronously
    const headerPath = path.join(MailService.TEMPLATE_PATH, 'partials', 'email_header.ejs')
    const footerPath = path.join(MailService.TEMPLATE_PATH, 'partials', 'email_footer.ejs')

    // Render header and footer and await them
    const headerHtml = await ejs.renderFile(headerPath, data, { async: true })
    const footerHtml = await ejs.renderFile(footerPath, data, { async: true })

    // 3) Render the Layout, passing the body, header, and footer HTML
    const layoutPath = path.join(MailService.TEMPLATE_PATH, 'layouts', 'email_layout.ejs')

    return await ejs.renderFile(
      layoutPath,
      {
        ...data,
        body,
        headerHtml, // Pass rendered header as a variable
        footerHtml, // Pass rendered footer as a variable
      },
      { async: true }
    )
  }

  // -----------------------------
  //     EMAIL FUNCTIONS
  // -----------------------------

  static async sendWelcomeEmail(user: User | SafeUser) {
    const subject = `Welcome to ${MailService.APPLICATION_NAME}`

    const emailContent = await MailService.renderTemplate('welcome.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: user.userProfile?.name || user.email },
    })

    await MailService.sendMail(user.email, subject, emailContent)
  }

  static async sendNewLoginEmail(
    user: User | SafeUser,
    _session?: SafeUserSession,
    userAgent?: UserAgentData
  ) {
    const subject = 'New Login Detected'

    const emailContent = await MailService.renderTemplate('new_login.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: user.userProfile?.name || user.email },
      device: userAgent?.device || 'Unknown',
      ip: userAgent?.ip || 'Unknown',
      location: userAgent?.city ? `${userAgent.city}, ${userAgent.country}` : 'Unknown',
      loginTime: new Date().toLocaleString(),
    })

    await MailService.sendMail(user.email, subject, emailContent)
  }

  static async sendForgotPasswordEmail(email: string, name?: string, resetToken?: string) {
    const subject = 'Reset Your Password'

    const resetLink =
      MailService.FRONTEND_URL +
      MailService.FRONTEND_FORGOT_PASSWORD_PATH +
      '?resetToken=' +
      resetToken +
      '&email=' +
      email

    const emailContent = await MailService.renderTemplate('forgot_password.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: name || email },
      resetToken,
      resetLink,
      expiryTime: 1,
    })

    await MailService.sendMail(email, subject, emailContent)
  }

  static async sendPasswordResetSuccessEmail(email: string, name?: string) {
    const subject = 'Password Reset Successful'

    const emailContent = await MailService.renderTemplate('password_reset.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: name || email },
    })

    await MailService.sendMail(email, subject, emailContent)
  }

  static async sendOTPEmail({
    email,
    name,
    otpToken,
  }: {
    email: string
    name?: string | null
    otpToken: string
  }) {
    if (!otpToken) throw new Error('OTP token is required')

    const subject = 'Your OTP Code'

    const emailContent = await MailService.renderTemplate('otp.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: name || email },
      otpToken,
    })

    await MailService.sendMail(email, subject, emailContent)
  }

  static async sendOTPEnabledEmail(email: string, name?: string) {
    const subject = 'OTP Enabled'

    const emailContent = await MailService.renderTemplate('otp_enabled.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: name || email },
    })

    await MailService.sendMail(email, subject, emailContent)
  }

  static async sendOTPDisabledEmail(email: string, name?: string) {
    const subject = 'OTP Disabled'

    const emailContent = await MailService.renderTemplate('otp_disabled.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: name || email },
    })

    await MailService.sendMail(email, subject, emailContent)
  }

  static async sendContactFormAdminEmail({
    message,
    name,
    email,
    phone,
  }: {
    message: string
    name: string
    email: string
    phone: string
  }) {
    const subject = 'New Contact Form Message'

    const emailContent = await MailService.renderTemplate('contact_form_admin.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      message,
      name,
      email,
      phone,
    })

    if (!MailService.INFORM_MAIL) {
      // No admin email configured
      return
    }

    await MailService.sendMail(MailService.INFORM_MAIL, subject, emailContent)
  }

  static async sendContactFormUserEmail({ name, email }: { name: string; email: string }) {
    const subject = 'We Received Your Message'

    const emailContent = await MailService.renderTemplate('contact_form_user.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name },
    })

    await MailService.sendMail(email, subject, emailContent)
  }

  static async sendEmailChangedEmail(user: User | SafeUser) {
    const subject = 'Your Email Was Updated'

    const emailContent = await MailService.renderTemplate('email_change.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: user.userProfile?.name || user.email },
    })

    await MailService.sendMail(user.email, subject, emailContent)
  }

  static async sendVerifyEmail(user: User | SafeUser, verifyToken: string) {
    const subject = 'Verify Your Email'

    const verifyLink =
      MailService.FRONTEND_URL + '/auth/verify-email?token=' + verifyToken + '&email=' + user.email

    const emailContent = await MailService.renderTemplate('verify_email.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: user.userProfile?.name || user.email },
      verifyLink,
    })

    await MailService.sendMail(user.email, subject, emailContent)
  }

  static async sendNewDeviceAlertEmail({
    user,
    device,
    ip,
    location,
    loginTime,
  }: {
    user: User | SafeUser
    device: string
    ip: string
    location: string
    loginTime: string
  }) {
    const subject = 'New Device Login Detected'

    const emailContent = await MailService.renderTemplate('new_device_alert.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: user.userProfile?.name || user.email },
      device,
      ip,
      location,
      loginTime,
    })

    await MailService.sendMail(user.email, subject, emailContent)
  }

  static async sendSuspiciousActivityEmail({
    user,
    eventType,
    ip,
    location,
    attemptTime,
  }: {
    user: User | SafeUser
    eventType: string
    ip: string
    location: string
    attemptTime: string
  }) {
    const subject = 'Suspicious Activity Detected'

    const emailContent = await MailService.renderTemplate('suspicious_activity.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: user.userProfile?.name || user.email },
      eventType,
      ip,
      location,
      attemptTime,
    })

    await MailService.sendMail(user.email, subject, emailContent)
  }

  static async sendPasswordChangedEmail(user: User | SafeUser) {
    const subject = 'Your Password Was Changed'

    const emailContent = await MailService.renderTemplate('password_changed.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: user.userProfile?.name || user.email },
    })

    await MailService.sendMail(user.email, subject, emailContent)
  }

  static async sendWeeklyDigestEmail(mail: string, posts: PostWithData[]) {
    const subject = 'Your Weekly Digest from Kuray.dev'

    const emailContent = await MailService.renderTemplate('weekly_digest.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      mail,
      posts,
    })

    await MailService.sendMail(mail, subject, emailContent)
  }

  static async sendCampaignEmail(
    to: string,
    subject: string,
    content: string,
    unsubscribeToken: string
  ) {
    const emailContent = await MailService.renderTemplate('campaign.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      content,
      unsubscribeToken,
    })

    await MailService.sendMail(to, subject, emailContent)
  }

  static async sendNewCommentNotification(user: User | SafeUser, post: any, comment: any) {
    const subject = `New Comment on "${post.title}"`

    const emailContent = await MailService.renderTemplate('comment_notification.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      user: { name: user.userProfile?.name || user.email },
      post,
      comment,
    })

    await MailService.sendMail(user.email, subject, emailContent)
  }

  static async sendAppointmentPendingEmail(appointment: any) {
    const subject = 'Your Appointment Request Was Received'

    const start = new Date(appointment.startTime)
    const end = new Date(appointment.endTime)

    const formattedDate = start.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const formattedTime =
      start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) +
      ' - ' +
      end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) +
      ' UTC'

    const emailContent = await MailService.renderTemplate('appointment_pending.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      appointment,
      formattedDate,
      formattedTime,
    })

    await MailService.sendMail(appointment.email, subject, emailContent)
  }

  static async sendAppointmentConfirmationEmail(appointment: Appointment) {
    const subject = 'Your Appointment is Confirmed'

    const start = new Date(appointment.startTime)
    const end = new Date(appointment.endTime)

    const formattedDate = start.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const formattedTime =
      start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) +
      ' - ' +
      end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) +
      ' UTC'

    const emailContent = await MailService.renderTemplate('appointment_confirm.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      appointment,
      formattedDate,
      formattedTime,
    })

    await MailService.sendMail(appointment.email, subject, emailContent)
  }

  static async sendWeeklyAdminAnalyticsEmail(stats: Stat) {
    if (!MailService.INFORM_MAIL) {
      // No admin email configured
      return
    }

    const subject = 'Weekly Analytics Summary'

    const emailContent = await MailService.renderTemplate('weekly_admin_analytics.ejs', {
      ...MailService.getBaseTemplateVars(),
      subject,
      stats,
    })

    await MailService.sendMail(MailService.INFORM_MAIL, subject, emailContent)
  }
}
