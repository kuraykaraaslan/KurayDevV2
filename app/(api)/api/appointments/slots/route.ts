
import AppointmentSlot from '@/types/AppointmentSlot'
import DailyAvailability from '@/types/DailyAvailability'

import { NextResponse } from 'next/server'


export async function GET() {
  // Simulate fetching data from a database or external API
  const availability: DailyAvailability[] = [
    {
      date: '2025-06-10',
      slots: [
        { date: '2025-06-10', time: '10:00', status: 'available' },
        { date: '2025-06-10', time: '11:00', status: 'available' },
        { date: '2025-06-10', time: '14:00', status: 'available' }
      ]
    },
    {
      date: '2025-06-11',
      slots: [
        { date: '2025-06-11', time: '09:00', status: 'available' },
        { date: '2025-06-11', time: '10:30', status: 'available' },
        { date: '2025-06-11', time: '13:00', status: 'available' }
      ]
    },
    {
      date: '2025-06-12',
      slots: [
        { date: '2025-06-12', time: '11:00', status: 'available' },
        { date: '2025-06-12', time: '12:30', status: 'available' },
        { date: '2025-06-12', time: '15:00', status: 'available' }
      ]
    }
  ]

  return NextResponse.json(availability)
}