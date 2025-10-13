'use client'

import axiosInstance from '@/libs/axios'
import { Day, Slot, SlotTemplate } from '@/types/CalendarTypes'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { format, parse, startOfWeek, addDays } from 'date-fns'

interface SlotTemplateBuilderProps {
    selectedDay: Day
    selectedDate: Date
    DAYS: Day[]
    TIME_INTERVALS: number[]
    setSelectedDay: (day: Day) => void,
    setSelectedDate: (date: Date) => void
}

export default function SlotTemplateBuilder({
    selectedDay,
    selectedDate = new Date(),
    DAYS,
    TIME_INTERVALS,
    setSelectedDay,
    setSelectedDate
}: SlotTemplateBuilderProps) {

    const [templateSlots, setTemplateSlots] = useState<Slot[]>([])
    const [interval, setInterval] = useState<number>(30)
    const [startTime, setStartTime] = useState('08:00')
    const [endTime, setEndTime] = useState('18:00')
    const [saving, setSaving] = useState(false)
    const [newTime, setNewTime] = useState('')

    const formattedDate = format(selectedDate, 'yyyy-MM-dd')

    /** Fetch Template Slots */
    const fetchTemplate = async (day: Day) => {
        try {
            const res = await axiosInstance.get(`/api/slot-templates/${day}`)
            setTemplateSlots(
                res.data.slots?.map((s: any) => ({
                    startTime: new Date(s.startTime),
                    endTime: new Date(s.endTime),
                    capacity: s.capacity
                })) || []
            )
        } catch (err) {
            console.error(err)
            toast.error('Failed to fetch template slots')
        }
    }

    useEffect(() => {
        fetchTemplate(selectedDay)
    }, [selectedDay])

    /** Generate slots between start and end */
    const generateTemplateSlots = () => {
        const [sh, sm] = startTime.split(':').map(Number)
        const [eh, em] = endTime.split(':').map(Number)
        const startMinutes = sh * 60 + sm
        const endMinutes = eh * 60 + em

        if (startMinutes >= endMinutes)
            return toast.error('Start time must be earlier than end time')

        const generated: Slot[] = []
        let current = startMinutes
        while (current < endMinutes) {
            const startH = Math.floor(current / 60)
            const startM = current % 60
            const endH = Math.floor((current + interval) / 60)
            const endM = (current + interval) % 60

            const start = parse(
                `${formattedDate} ${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
                'yyyy-MM-dd HH:mm',
                new Date()
            )
            const end = parse(
                `${formattedDate} ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
                'yyyy-MM-dd HH:mm',
                new Date()
            )

            if (end > start && end <= parse(`${formattedDate} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date())) {
                generated.push({ startTime: start, endTime: end, capacity: 1 })
            }

            current += interval
        }

        setTemplateSlots(generated)
        toast.info(`Generated ${generated.length} slots`)
    }

    /** Add manual slot */
    const addTemplateSlot = () => {
        if (!newTime) return toast.warn('Please select a time')

        const start = parse(`${formattedDate} ${newTime}`, 'yyyy-MM-dd HH:mm', new Date())
        const end = new Date(start.getTime() + interval * 60 * 1000)

        if (templateSlots.some((s) => s.startTime.getTime() === start.getTime()))
            return toast.warn('Slot already exists')

        const newSlot: Slot = { startTime: start, endTime: end, capacity: 1 }
        setTemplateSlots((prev) => [...prev, newSlot].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()))
        setNewTime('')
    }

    /** Remove one or all slots */
    const removeTemplateSlot = (slot: Slot) =>
        setTemplateSlots((prev) => prev.filter((s) => s.startTime.getTime() !== slot.startTime.getTime()))
    const removeAllTemplateSlots = () => setTemplateSlots([])

    /** Save Template */
    const saveTemplate = async () => {
        setSaving(true)
        try {
            const payload: SlotTemplate = {
                day: selectedDay,
                slots: templateSlots
            }
            await axiosInstance.post(`/api/slot-templates/${selectedDay}`, payload)
            toast.success('Template saved successfully')
        } catch (e) {
            console.error(e)
            toast.error('Failed to save template')
        } finally {
            setSaving(false)
        }
    }

    /** Apply Template to Date */
    const applyTemplateToDate = async () => {

        if (!confirm(`Apply ${selectedDay} template to ${formattedDate}? This will overwrite existing slots.`)) return
        if (templateSlots.length === 0) return toast.warn('No slots to apply')

        try {
            const payload = {
                formattedDate: formattedDate,
            }
            await axiosInstance.post('/api/slot-templates/' + selectedDay + '/apply', payload)
            toast.success(`Template applied to ${formattedDate}`)
        } catch (err) {
            console.error(err)
            toast.error('Failed to apply template')
        }
    }

    /** Apply all templates to current week (Mon–Sun) */
    const applyAllTemplateToWeek = async () => {

        if (!confirm(`This will overwrite existing slots for the week that start from the ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM yyyy')}. Continue?`)) return

        try {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
            for (let i = 0; i < 7; i++) {
                const day = DAYS[i]
                const date = addDays(weekStart, i)
                const formatted = format(date, 'yyyy-MM-dd')

                // fetch each day's template first
                const res = await axiosInstance.get(`/api/slot-templates/${day}`)
                const slots: Slot[] =
                    res.data.slots?.map((s: any) => ({
                        startTime: new Date(s.startTime),
                        endTime: new Date(s.endTime),
                        capacity: s.capacity
                    })) || []

                if (slots.length > 0) {
                    const payload = {
                        date: formatted,
                        slots: slots.map((s) => ({
                            startTime: s.startTime.toISOString(),
                            endTime: s.endTime.toISOString(),
                            capacity: s.capacity
                        }))
                    }
                    await axiosInstance.post(`/api/slots-template/${day}/apply`, payload)
                }
            }

            toast.success('Templates applied to all week successfully')
        } catch (err) {
            console.error(err)
            toast.error('Failed to apply templates to week')
        }
    }

    return (
        <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
                <h2 className="text-2xl font-semibold mb-2">Template Builder</h2>
                <div className="text-sm text-gray-500 mb-4">
                    Create and manage slot templates for each day of the week.
                </div>

                {/* Day Selector */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {DAYS.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`btn btn-sm rounded-full ${selectedDay === day
                                ? 'btn-primary text-white'
                                : 'btn-outline border-gray-400 text-gray-600'
                                }`}
                        >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Generator */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div>
                        <label className="text-xs text-gray-600">Start</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600">End</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600">Interval</label>
                        <select
                            value={interval}
                            onChange={(e) => setInterval(Number(e.target.value))}
                            className="select select-bordered w-full"
                        >
                            {TIME_INTERVALS.map((i) => (
                                <option key={i} value={i}>
                                    {i} min
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={generateTemplateSlots} className="btn btn-outline w-full">
                            Generate
                        </button>
                    </div>
                </div>

                {/* Manual Add */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="input input-bordered w-full"
                    />
                    <button className="btn btn-outline" onClick={addTemplateSlot}>
                        Add
                    </button>
                </div>

                {/* Save + Apply */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                        onClick={saveTemplate}
                        disabled={saving}
                        className="btn btn-primary text-white"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={applyTemplateToDate} className="btn btn-accent text-white">
                        Apply to {formattedDate}
                    </button>
                    <button onClick={applyAllTemplateToWeek} className="btn btn-secondary text-white">
                        Apply to Week of {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM')}
                    </button>
                </div>

                {/* Remove All */}
                <button onClick={removeAllTemplateSlots} className="btn btn-outline w-full mb-3">
                    Remove All Slots
                </button>

                {/* Slot List */}
                <div className="bg-base-200 rounded-lg max-h-[300px] overflow-y-auto p-2">
                    {templateSlots.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">No slots yet</p>
                    ) : (
                        templateSlots.map((slot, i) => (
                            <SingleTemplateSlot
                                key={i}
                                slot={slot}
                                removeTemplateSlot={removeTemplateSlot}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

function SingleTemplateSlot({
    slot, key, removeTemplateSlot
}: {
    slot: Slot,
    key: number,
    removeTemplateSlot: (slot: Slot) => void
}) {
    return (
        <div
            key={key}
            className="flex justify-between items-center px-3 py-2 bg-base-100 rounded-lg mb-2 shadow-sm"
        >
            <span className="font-mono">
                {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
            </span>
            <button
                className="btn btn-xs btn-error text-white"
                onClick={() => removeTemplateSlot(slot)}
            >
                ✕
            </button>
        </div>
    )
}