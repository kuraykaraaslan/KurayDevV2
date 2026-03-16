import { NextResponse } from 'next/server'
import DiscordService from '@/services/SocialMediaService/DiscordService'
import InAppNotificationService from '@/services/InAppNotificationService'
import ContactFormService from '@/services/ContactFormService'
import MailService from '@/services/NotificationService/MailService'
import SMSService from '@/services/NotificationService/SMSService'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { ContactFormRequestSchema } from '@/dtos/AIAndServicesDTO'
import ContactMessages from '@/messages/ContactMessages'
import { checkForSpam, verifyRecaptcha } from '@/helpers/SpamProtection'
import Logger from '@/libs/logger'

type ResponseData = {
  message: string
}

export async function GET(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const search = searchParams.get('search') || undefined
    const sortKey = searchParams.get('sortKey') || undefined
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    const result = await ContactFormService.getAllContactForms(page, pageSize, search, sortKey, sortDir)

    return NextResponse.json({
      contactForms: result.contactForms,
      total: result.total,
      page,
      pageSize,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, _response: NextResponse<ResponseData>) {
  const body = await request.json()

  const parsedData = ContactFormRequestSchema.safeParse(body)

  if (!parsedData.success) {
    return NextResponse.json(
      {
        message: parsedData.error.errors.map((err) => err.message).join(', '),
      },
      { status: 400 }
    )
  }

  const { name, email, phone, message, website, _formLoadTime, recaptchaToken } = parsedData.data

  // reCAPTCHA server-side verification
  const recaptchaValid = await verifyRecaptcha(recaptchaToken)
  if (!recaptchaValid) {
    return NextResponse.json({ message: 'reCAPTCHA verification failed' }, { status: 400 })
  }

  // Spam protection checks
  const spamCheck = checkForSpam({
    honeypot: website,
    formLoadTime: _formLoadTime,
    message,
  })

  if (spamCheck.isSpam) {
    Logger.warn(`[ContactForm] Spam detected: ${spamCheck.reason} - Email: ${email}`)
    // Return success to not reveal detection to bots
    return NextResponse.json({ message: ContactMessages.MESSAGE_SENT_SUCCESSFULLY })
  }

  const isRateLimited = await ContactFormService.isRateLimited(phone, email)

  if (isRateLimited) {
    return NextResponse.json({ message: ContactMessages.TOO_MANY_REQUESTS }, { status: 429 })
  }

  try {
    const data = {
      name: name,
      email: email,
      phone: phone,
      message: message,
    }

    await ContactFormService.createContactForm(data)
    InAppNotificationService.pushToAdmins({
      title: 'New Contact Message',
      message: `${name || email} sent you a message`,
      path: '/admin/contacts',
    }).catch(() => {})
  } catch (error) {
    Logger.error('[ContactForm] DB Error: ' + error)
  }

  try {
    await MailService.sendContactFormAdminEmail({ name, email, phone, message })
  } catch (error) {
    Logger.error('[ContactForm] Admin Email Error: ' + error)
  }

  try {
    await MailService.sendContactFormUserEmail({ name, email })
  } catch (error) {
    Logger.error('[ContactForm] User Email Error: ' + error)
  }

  try {
    const discordMessage = `A new message has been received from the contact form.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
    await DiscordService.sendWebhookMessage(discordMessage)
  } catch (error) {
    Logger.error('[ContactForm] Discord Error: ' + error)
  }

  try {
    const userSMSBody =
      `Hi ${name},\n\n` +
      `Thank you for reaching out to us. We have received your message and will get back to you shortly.\n\n` +
      `Best regards,\n` +
      `Kuray Karaaslan`

    await SMSService.sendShortMessage({ to: phone, body: userSMSBody })
  } catch (error) {
    Logger.error('[ContactForm] SMS Error: ' + error)
  }

  return NextResponse.json({ message: ContactMessages.MESSAGE_SENT_SUCCESSFULLY })
}
