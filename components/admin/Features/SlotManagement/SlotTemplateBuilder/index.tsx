'use client'

import axiosInstance from '@/libs/axios'
import { Day, Slot, SlotTemplate } from '@/types/features/CalendarTypes'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { format, parse, startOfWeek, addDays } from 'date-fns'
import { useTranslation } from 'react-i18next'

interface SlotTemplateBuilderProps {
  selectedDay: Day
  selectedDate: Date
  DAYS: Day[]
  TIME_INTERVALS: number[]
  setSelectedDay: (day: Day) => void
}

export default function SlotTemplateBuilder({
  selectedDay,
  selectedDate = new Date(),
  DAYS,
  TIME_INTERVALS,
  setSelectedDay,
}: SlotTemplateBuilderProps) {
  const { t } = useTranslation()

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
          capacity: s.capacity,
        })) || []
      )
    } catch (err) {
      console.error(err)
      toast.error(t('admin.slots.fetch_failed'))
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

    if (startMinutes >= endMinutes) return toast.error(t('admin.slots.start_earlier_error'))

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

      if (
        end > start &&
        end <= parse(`${formattedDate} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date())
      ) {
        generated.push({ startTime: start, endTime: end, capacity: 1 })
      }

      current += interval
    }

    setTemplateSlots(generated)
    toast.info(t('admin.slots.generated_slots', { count: generated.length }))
  }

  /** Add manual slot */
  const addTemplateSlot = () => {
    if (!newTime) return toast.warn(t('admin.slots.please_select_time'))

    const start = parse(`${formattedDate} ${newTime}`, 'yyyy-MM-dd HH:mm', new Date())
    const end = new Date(start.getTime() + interval * 60 * 1000)

    if (templateSlots.some((s) => s.startTime.getTime() === start.getTime()))
      return toast.warn(t('admin.slots.slot_exists'))

    const newSlot: Slot = { startTime: start, endTime: end, capacity: 1 }
    setTemplateSlots((prev) =>
      [...prev, newSlot].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    )
    setNewTime('')
  }

  /** Remove one or all slots */
  const removeTemplateSlot = (slot: Slot) =>
    setTemplateSlots((prev) =>
      prev.filter((s) => s.startTime.getTime() !== slot.startTime.getTime())
    )
  const removeAllTemplateSlots = () => setTemplateSlots([])

  /** Save Template */
  const saveTemplate = async () => {
    setSaving(true)
    try {
      const payload: SlotTemplate = {
        day: selectedDay,
        slots: templateSlots,
      }
      await axiosInstance.post(`/api/slot-templates/${selectedDay}`, payload)
      toast.success(t('admin.slots.template_saved'))
    } catch (e) {
      console.error(e)
      toast.error(t('admin.slots.template_failed'))
    } finally {
      setSaving(false)
    }
  }

  /** Apply Template to Date */
  const applyTemplateToDate = async () => {
    if (!confirm(t('admin.slots.apply_confirm', { day: selectedDay, date: formattedDate }))) return
    if (templateSlots.length === 0) return toast.warn(t('admin.slots.no_slots'))

    try {
      const payload = {
        formattedDate: formattedDate,
      }
      await axiosInstance.post('/api/slot-templates/' + selectedDay + '/apply', payload)
      toast.success(t('admin.slots.apply_success', { date: formattedDate }))
    } catch (err) {
      console.error(err)
      toast.error(t('admin.slots.apply_failed'))
    }
  }

  /** Apply all templates to current week (Mon–Sun) */
  const applyAllTemplateToWeek = async () => {
    if (
      !confirm(
        t('admin.slots.week_confirm', {
          date: format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM yyyy'),
        })
      )
    )
      return

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
            capacity: s.capacity,
          })) || []

        if (slots.length > 0) {
          const payload = {
            date: formatted,
            slots: slots.map((s) => ({
              startTime: s.startTime.toISOString(),
              endTime: s.endTime.toISOString(),
              capacity: s.capacity,
            })),
          }
          await axiosInstance.post(`/api/slots-template/${day}/apply`, payload)
        }
      }

      toast.success(t('admin.slots.apply_week_success'))
    } catch (err) {
      console.error(err)
      toast.error(t('admin.slots.apply_failed'))
    }
  }

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h2 className="text-2xl font-semibold mb-2">{t('admin.slots.template_builder')}</h2>
        <div className="text-sm text-gray-500 mb-4">{t('admin.slots.create_and_manage')}</div>

        {/* Day Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`btn btn-sm rounded-full ${
                selectedDay === day
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
            <label className="text-xs text-gray-600">{t('admin.slots.start_time')}</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">{t('admin.slots.end_time')}</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">{t('admin.slots.interval')}</label>
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
              {t('admin.slots.generate')}
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
            {t('admin.slots.add')}
          </button>
        </div>

        {/* Save + Apply */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={saveTemplate} disabled={saving} className="btn btn-primary text-white">
            {saving ? t('admin.slots.saving') : t('admin.slots.save_template')}
          </button>
          <button onClick={applyTemplateToDate} className="btn btn-accent text-white">
            {t('admin.slots.apply_template_date')}
          </button>
          <button onClick={applyAllTemplateToWeek} className="btn btn-secondary text-white">
            {t('admin.slots.apply_template_week')}
          </button>
        </div>

        {/* Remove All */}
        <button onClick={removeAllTemplateSlots} className="btn btn-outline w-full mb-3">
          {t('admin.slots.remove_all')}
        </button>

        {/* Slot List */}
        <div className="bg-base-200 rounded-lg max-h-[300px] overflow-y-auto p-2">
          {templateSlots.length === 0 ? (
            <p className="text-gray-500 text-center py-6">{t('admin.slots.no_slots')}</p>
          ) : (
            templateSlots.map((slot, i) => (
              <SingleTemplateSlot key={i} slot={slot} removeTemplateSlot={removeTemplateSlot} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function SingleTemplateSlot({
  slot,
  key,
  removeTemplateSlot,
}: {
  slot: Slot
  key: number
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
      <button className="btn btn-xs btn-error text-white" onClick={() => removeTemplateSlot(slot)}>
        ✕
      </button>
    </div>
  )
}
