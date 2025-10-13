import { Slot } from "@/types/CalendarTypes"
import { differenceInMinutes, format } from "date-fns"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCalendar, faClock, faStopwatch } from "@fortawesome/free-solid-svg-icons"
import { toast } from "react-toastify"
import axiosInstance from "@/libs/axios"

const AppointmentModal = ({ selectedSlot , preloadRange}: { selectedSlot: Slot | null, preloadRange: () => Promise<void> }) => {
    
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSlot) return toast.error('Önce bir saat seçin.')

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
                toast.success('Randevunuz oluşturuldu.')
                await preloadRange()
                    ; (document.getElementById('appt_modal') as HTMLDialogElement)?.close()
            } else {
                toast.error(res.data?.message || 'Randevu alınamadı')
            }
        } catch (err) {
            console.error(err)
            toast.error('Bir hata oluştu')
        }
    }


    return (
        <dialog id="appt_modal" className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Randevu Bilgileri</h3>
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
                            dk
                        </span>
                    </p>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-3">
                    <label className="label">
                        <span className="label-text">Ad Soyad</span>
                    </label>
                    <input type="text" name="name" required className="input input-bordered w-full" />

                    <label className="label">
                        <span className="label-text">E-posta</span>
                    </label>
                    <input type="email" name="email" required className="input input-bordered w-full" />

                    <label className="label">
                        <span className="label-text">Telefon</span>
                    </label>
                    <input type="tel" name="phone" required className="input input-bordered w-full" />

                    <label className="label">
                        <span className="label-text">Not</span>
                    </label>
                    <textarea name="note" rows={3} className="textarea textarea-bordered w-full" />

                    <button type="submit" className="btn btn-primary w-full">
                        Randevuyu Oluştur
                    </button>
                </form>

                <div className="modal-action">
                    <form method="dialog" className="w-full">
                        <button className="btn btn-secondary btn-block">Kapat</button>
                    </form>
                </div>
            </div>
        </dialog>
    )
}
export default AppointmentModal