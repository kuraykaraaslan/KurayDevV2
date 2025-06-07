export default interface AppointmentSlot {
    date: string
    time: string
    status: 'available' | 'booked' | 'unavailable'
    length?: number // Optional, for future use if needed
  }
  