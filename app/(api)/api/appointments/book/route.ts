import AppointmentService from '@/services/AppointmentService'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const result = await AppointmentService.bookAppointment(body)

  if (!result.success) {
    return NextResponse.json(result, { status: 400 })
  }

  return NextResponse.json(result)
}
