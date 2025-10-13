import { Day, Slot } from "@/types/CalendarTypes"
import { useEffect, useState } from "react";
import { format } from "date-fns";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axiosInstance from "@/libs/axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const SlotsEditor = (
    {
        selectedDay,
        selectedDate,
        setSelectedDay,
        setSelectedDate
    }: {
        selectedDay: Day,
        selectedDate: Date,
        setSelectedDay: (day: Day) => void,
        setSelectedDate: (date: Date) => void
    }
) => {

    const [dailySlots, setDailySlots] = useState<Slot[]>([])
    const [loading, setLoading] = useState(false)
    const formattedDate = format(selectedDate, 'yyyy-MM-dd')


    /** Fetch Slots for selected date */
    const fetchDailySlots = async (date: string) => {
        setLoading(true)
        try {
            const res = await axiosInstance.get(`/api/slots/${date}`)
            setDailySlots(res.data.slots || [])
        } catch {
            toast.error('Failed to fetch daily slots')
        } finally {
            setLoading(false)
        }
    }

    const removeSlot = (index: number) => {
        const updatedSlots = [...dailySlots]
        updatedSlots.splice(index, 1)
        setDailySlots(updatedSlots)
    }

    const updateDailySlots = () => {
        setLoading(true)
        axiosInstance.put(`/api/slots/${formattedDate}`, { slots: dailySlots })
            .then(() => {
                toast.success('Slots updated successfully')
            })
            .catch(() => {
                toast.error('Failed to update slots')
            })
            .finally(() => {
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchDailySlots(formattedDate)
    }, [formattedDate])

    return (
        <div className="card bg-base-100 shadow-xl border border-base-200 p-4">
            <div className="flex flex-col items-center mb-6">
                <Calendar
                    onChange={(value) => {
                        if (value instanceof Date) {
                            setSelectedDate(value);
                        } else if (Array.isArray(value) && value[0] instanceof Date) {
                            setSelectedDate(value[0]);
                        }

                    }}
                    value={selectedDate}
                    className="react-calendar border border-gray-300 rounded-lg p-2 w-full"
                />
            </div>

            <h2 className="text-lg font-semibold mb-2 text-center">
                {format(selectedDate, 'EEEE, dd MMM yyyy')}
            </h2>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : dailySlots.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No slots for this day</div>
            ) : (
                <div className="overflow-y-auto max-h-[250px]">
                    {dailySlots.map((slot, i) => (
                        <SingleSlot
                            key={i}
                            slot={slot}
                            index={i}
                            removeSlot={removeSlot}
                        />
                    ))}
                </div>
            )}

            <div className="mt-4 w-full flex justify-end">
                <button
                    className="btn btn-primary btn-block"
                    onClick={updateDailySlots}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}

export function SingleSlot({
    slot, index, removeSlot
}: {
    slot: Slot,
    index: number,
    removeSlot: (index: number) => void
}) {

    return (
        <div
            key={index}
            className="flex justify-between items-center px-3 py-2 bg-base-100 rounded-lg mb-2 shadow-sm"
        >
            <span className="font-mono">
                {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
            </span>
            <span className="text-sm text-gray-500">
                Capacity: {slot.capacity}
            </span>
            <button
                className="btn btn-xs btn-error text-white"
                onClick={() => removeSlot(index)}
            >
                ✕
            </button>
        </div>
    )
}

export default SlotsEditor;