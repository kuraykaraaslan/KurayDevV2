'use client'
import { useState } from 'react'
import type { Day } from '@/types/CalendarTypes'

import SlotTemplateBuilder from '@/components/admin/Features/SlotManagement/SlotTemplateBuilder'
import SlotsEditor from '@/components/admin/Features/SlotManagement/SlotsEditor'

export default function SlotTemplatesPage() {
    const [selectedDay, setSelectedDay] = useState<Day>('monday')
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    const TIME_INTERVALS = [15, 30, 45, 60]
    const DAYS: Day[] = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ]

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold mb-6">Slot Templates & Calendar</h1>
            <div className="grid lg:grid-cols-2 gap-6">
                <SlotTemplateBuilder selectedDay={selectedDay} setSelectedDay={setSelectedDay} DAYS={DAYS} TIME_INTERVALS={TIME_INTERVALS} selectedDate={selectedDate} />
                <SlotsEditor selectedDay={selectedDay} setSelectedDay={setSelectedDay} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            </div>
        </div>
    )
}
