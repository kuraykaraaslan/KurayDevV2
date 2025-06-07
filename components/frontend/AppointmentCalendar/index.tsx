'use client'

import React, { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import useGlobalStore from '@/libs/zustand'
import SSOLogin from './SSOLogin'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendar,
  faClock,
  faStopwatch,
  faUser
} from '@fortawesome/free-solid-svg-icons'

interface AppointmentSlot {
  date: string
  time: string
  status: 'available' | 'booked' | 'unavailable'
  length?: number // Optional, for future use if needed
}

interface DailyAvailability {
  date: string
  slots: AppointmentSlot[]
}

const exampleAvailability: DailyAvailability[] = [
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

export default function AppointmentCalendar () {
  // === State ===
  const [availabilities, setAvailabilities] =
    useState<DailyAvailability[]>(exampleAvailability)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)
  const today = new Date()

  const { t } = useTranslation()
  const { user } = useGlobalStore()

  // === Yardımcı Fonksiyonlar ===
  const formatDate = (date: Date) => date.toLocaleDateString('sv-SE')

  const getTileClassName = (date: Date): string => {
    const dateStr = formatDate(date)
    return availabilities.some(a => a.date === dateStr)
      ? 'available'
      : 'unavailable'
  }

  const getSlotsForDate = (date: string) => {
    return availabilities.find(a => a.date === date)?.slots || []
  }

  const handleDateSelect = (date: Date) => {
    // Dont allow past dates
    if (date < today) {
      toast.info(t('calendar.pastDateError'))
      return
    }
    setSelectedDate(formatDate(date))
    setSelectedSlot(null)
  }

  const handleTimeSelect = (slot: AppointmentSlot) => {
    setSelectedSlot(slot)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget as HTMLFormElement)
    const name = data.get('name')
    const email = data.get('email')
    const note = data.get('note')

    console.log('Booking submitted:', {
      name,
      email,
      note,
      slot: selectedSlot
    })

    alert('Randevu oluşturuldu!')
  }

  return (
    <section className='bg-base-200 pt-16' id='portfolio'>
      <div className='px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000'>
        <div className='mx-auto max-w-screen-sm text-center lg:mb-8 -mt-8 lg:mt-0 '>
          <h2 className='mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold'>
            {t('calendar.title')}
          </h2>
          <p className='font-light sm:text-xl'>{t('calendar.description')}</p>
        </div>

        <div className='flex flex-wrap justify-center gap-4 mb-8 mt-3'>
          <div className='w-full sm:w-1/2 md:w-1/3'>
            <Calendar
              onChange={handleDateSelect}
              value={selectedDate ? new Date(selectedDate) : new Date()}
              tileClassName={({ date }) => getTileClassName(date)}
            />
          </div>

          <div className='w-full sm:w-1/2 md:w-1/3'>
            {selectedDate && (
              <div className=''>
                <h3 className='text-lg font-semibold mb-2'>
                  {t('calendar.availableSlots')}
                </h3>
                <ul className='flex flex-wrap gap-2'>
                  {getSlotsForDate(selectedDate).map((slot, index) => (
                    <li key={index}>
                      <button
                        className={`btn btn-sm ${
                          selectedSlot?.time === slot.time
                            ? 'btn-accent'
                            : 'btn-outline'
                        }`}
                        onClick={() => handleTimeSelect(slot)}
                      >
                        {slot.time}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedSlot && (
              <div className='mt-4'>
                {!user ? (
                  <SSOLogin />
                ) : (
                  <>
                    <h3 className='text-lg font-semibold mb-2'>
                      {t('calendar.selectedSlot')}
                    </h3>
                    <p className='text-sm'>
                      <span className='font-semibold mr-2'>
                        <FontAwesomeIcon icon={faCalendar} className='mr-2' />
                        {selectedDate}
                      </span>
                      <span className='font-semibold mr-2'>
                        <FontAwesomeIcon icon={faClock} className='mr-2' />
                        {selectedSlot.time}
                      </span>
                      <span className='font-semibold'>
                        <FontAwesomeIcon icon={faStopwatch} className='mr-2' />
                        {t('calendar.minutes', {
                          count: selectedSlot.length || 30
                        })}
                      </span>
                    </p>
                    <p className='text-sm mt-2'>
                      <span className='font-semibold mr-2'>
                        <FontAwesomeIcon icon={faUser} className='mr-2' />
                        {user.name || user.email}
                      </span>
                    </p>

                    <form onSubmit={handleFormSubmit} className='mt-4'>
                      <textarea
                        name='note'
                        placeholder={t('calendar.notePlaceholder')}
                        className='textarea textarea-bordered w-full mb-2'
                      />
                      <button type='submit' className='btn btn-primary w-full'>
                        {t('calendar.bookAppointment')}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
