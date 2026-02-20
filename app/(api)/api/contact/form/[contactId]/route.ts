import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import ContactFormService from '@/services/ContactFormService'
import ContactMessages from '@/messages/ContactMessages'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { contactId } = await params

    const deleted = await ContactFormService.deleteContactForm(contactId)

    if (!deleted) {
      return NextResponse.json({ message: ContactMessages.CONTACT_NOT_FOUND }, { status: 404 })
    }

    return NextResponse.json(
      { message: ContactMessages.CONTACT_DELETED_SUCCESSFULLY },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting contact form:', error)
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 })
  }
}
