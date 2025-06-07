import AppointmentSlot from './AppointmentSlot';

export default interface DailyAvailability {
    date: string
    slots: AppointmentSlot[]
}