import AppointmentService from '@/services/AppointmentService'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await AppointmentService.getAvailability()
  return NextResponse.json(result)
}
