import { Slot } from '@/types/features/CalendarTypes'
import { differenceInMinutes, format } from "date-fns"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCalendar, faClock, faStopwatch } from "@fortawesome/free-solid-svg-icons"
import { toast } from "react-toastify"
import axiosInstance from "@/libs/axios"
import { FormEvent } from "react"
import { useTranslation } from "react-i18next"

const AppointmentModal = ({ selectedSlot , preloadRange}: { selectedSlot: Slot | null, preloadRange: () => Promise<void> }) => {
    const { t } = useTranslation()
    
    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!selectedSlot) return toast.error(t('shared.calendar.select_slot_first'))

        const data = new FormData(e.currentTarget as HTMLFormElement)
        const name = data.get('name') as string
        const email = data.get('email') as string
        const phone = data.get('phone') as string
        const note = (data.get('note') as string) || ''

        try {
            const res = await axiosInstance.post('/api/booking', {
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                name,
                email,
                phone,
                note,
            })
            if (res.data?.success) {
                toast.success(t('shared.calendar.appointment_created'))
                await preloadRange()
                    ; (document.getElementById('appt_modal') as HTMLDialogElement)?.close()
            } else {
                toast.error(res.data?.message || t('shared.calendar.appointment_error'))
            }
        } catch (err) {
            console.error(err)
            toast.error(t('shared.calendar.error_occurred'))
        }
    }


    return (
        <dialog id="appt_modal" className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">{t('shared.calendar.appointment_info')}</h3>
                {selectedSlot && (
                    <p className="text-sm space-x-2 mb-4">
                        <span className="font-semibold">
                            <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                            {format(new Date(selectedSlot.startTime), 'yyyy-MM-dd')}
                        </span>
                        <span className="font-semibold">
                            <FontAwesomeIcon icon={faClock} className="mr-2" />
                            {format(new Date(selectedSlot.startTime), 'HH:mm')} -{' '}
                            {format(new Date(selectedSlot.endTime), 'HH:mm')}
                        </span>
                        <span className="font-semibold">
                            <FontAwesomeIcon icon={faStopwatch} className="mr-2" />
                            {differenceInMinutes(
                                new Date(selectedSlot.endTime),
                                new Date(selectedSlot.startTime)
                            )}{' '}
                            {t('shared.calendar.minutes_abbr')}
                        </span>
                    </p>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-3">
                    <label className="label">
                        <span className="label-text">{t('shared.calendar.full_name')}</span>
                    </label>
                    <input type="text" name="name" required className="input input-bordered w-full" />

                    <label className="label">
                        <span className="label-text">{t('shared.calendar.email_label')}</span>
                    </label>
                    <input type="email" name="email" required className="input input-bordered w-full" />

                    <label className="label">
                        <span className="label-text">{t('shared.calendar.phone_label')}</span>
                    </label>
                    <input type="tel" name="phone" required className="input input-bordered w-full" />

                    <label className="label">
                        <span className="label-text">{t('shared.calendar.note_label')}</span>
                    </label>
                    <textarea name="note" rows={3} className="textarea textarea-bordered w-full" />

                    <button type="submit" className="btn btn-primary w-full">
                        {t('shared.calendar.create_appointment')}
                    </button>
                </form>

                <div className="modal-action">
                    <form method="dialog" className="w-full">
                        <button className="btn btn-secondary btn-block">{t('shared.calendar.close_modal')}</button>
                    </form>
                </div>
            </div>
        </dialog>
    )
}
export default AppointmentModal