'use client'

import { useEffect, useState } from 'react'
import './style.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendar, faClock, faStopwatch, faX } from '@fortawesome/free-solid-svg-icons'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import type { Slot } from '@/types/CalendarTypes'
import axios from 'axios'
import AppointmentModal from './AppointmentModal'
import dynamic from 'next/dynamic'
import LoadingElement from '@/components/frontend/UI/Content/LoadingElement'

const Calendar = dynamic(() => import('react-calendar'), { ssr: false, loading: () => <LoadingElement title="Calendar" /> })

export default function AppointmentCalendar() {
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const today = new Date()

  /** Format date as yyyy-MM-dd */
  const formatDate = (date: Date) => format(date, 'yyyy-MM-dd')

  /** Tile styling */
  const getTileClassName = ({ date }: { date: Date }): string => {
    const d = formatDate(date)
    const todayStr = formatDate(today)
    const hasSlot = availableSlots.some(
      (s) => format(new Date(s.startTime), 'yyyy-MM-dd') === d
    )
    const isSelected = format(selectedDate, 'yyyy-MM-dd') === d
    const isPast = date < new Date(todayStr)

    const classes: string[] = []
    if (isSelected) classes.push('selected')
    if (d === todayStr) classes.push('now')
    classes.push(hasSlot ? 'available' : 'unavailable')
    if (isPast) classes.push('disabled')
    return classes.join(' ')
  }

  const slotsOf = (date: Date) => {
    const d = format(date, 'yyyy-MM-dd')
    return availableSlots.filter(
      (s) => format(new Date(s.startTime), 'yyyy-MM-dd') === d
    )
  }

  const handleDateSelect = (
    value: Date | Date[] | null,
  ) => {
    if (value instanceof Date) {
      setSelectedDate(value)
      setSelectedSlot(null)
    }
  }

  const handleTimeSelect = (slot: Slot) => {
    setSelectedSlot(slot)
  }

  const preloadRange = async () => {
    const start = new Date()
    const end = new Date()
    end.setDate(start.getDate() + 14)

     await axios.get(
        `/api/slots?startDate=${formatDate(start)}&endDate=${formatDate(end)}`
     ).then((res) => {
      const data = (res.data?.slots || []) as Slot[]
      setAvailableSlots(data)

      // Select first available date automatically
      if (!selectedDate && data.length > 0) {
        const first = new Date(data[0].startTime)
        setSelectedDate(first)
      }
      }).catch((err) => {
        setAvailableSlots([])
        console.error(err)
      })
    
  }

  useEffect(() => {
    preloadRange()
  }, [])

  return (
    <section className="bg-base-200 pt-16" id="appointments">
      <div className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center -mt-8 lg:mt-0">
          <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold">
            Randevu
          </h2>
          <p className="font-light sm:text-xl">Uygun bir günü ve saati seçin</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8 mt-3">
          <div className="w-1/2 sm:w-1/3 md:w-1/4">
            <Calendar
              // @ts-ignore
              onChange={handleDateSelect}
              value={selectedDate}
              tileClassName={getTileClassName}
              minDate={today}
              maxDate={new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)}
            />
          </div>

          <div className="w-1/2 sm:w-1/3 md:w-1/4">
            {slotsOf(selectedDate).length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Mevcut Saatler</h3>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                  {slotsOf(selectedDate).map((slot, idx) => {
                    const start = new Date(slot.startTime)
                    const end = new Date(slot.endTime)
                    const length = differenceInMinutes(end, start)
                    const label = `${format(start, 'HH:mm')}`
                    const isSelected =
                      selectedSlot?.startTime === slot.startTime &&
                      selectedSlot?.endTime === slot.endTime

                    return (
                      <button
                        key={idx}
                        disabled={slot.capacity <= 0}
                        className={`btn btn-outline btn-sm btn-block text-left h-16 ${isSelected ? 'btn-primary' : ''
                          } ${slot.capacity <= 0 ? 'btn-disabled cursor-not-allowed' : ''}`}
                        onClick={() => handleTimeSelect(slot)}
                      >
                        <FontAwesomeIcon icon={slot.capacity <= 0 ? faX : faClock} className="mr-2" />
                        {label} ({length} dk)
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Seçilen gün için müsait saat yok.</p>
            )}

            {selectedSlot && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Seçilen Saat</h3>
                <p className="text-sm space-x-2">
                  <span className="font-semibold">
                    <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                    {format(parseISO(selectedSlot.startTime.toString()), 'yyyy-MM-dd')}
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
                <button
                  className="btn btn-primary btn-block mt-4"
                  onClick={() =>
                    (document.getElementById('appt_modal') as HTMLDialogElement)?.showModal()
                  }
                >
                  Randevu Al
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AppointmentModal selectedSlot={selectedSlot} preloadRange={preloadRange} />
    </section>
  )
}
