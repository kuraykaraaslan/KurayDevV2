'use client'

import React, { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import './style.css'
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

import AppointmentSlot from '@/types/AppointmentSlot'
import DailyAvailability from '@/types/DailyAvailability'

import axiosInstance from '@/libs/axios'

export default function AppointmentCalendar () {
  const [availabilities, setAvailabilities] = useState<DailyAvailability[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)
  const today = new Date()

  const { t } = useTranslation()
  const { user } = useGlobalStore()

  const formatDate = (date: Date) => date.toLocaleDateString('sv-SE')

  const getTileClassName = (date: Date): string => {
    const dateStr = formatDate(date)
    const isToday = date.toDateString() === today.toDateString()
    const hasSlot = availabilities.some(a => a.date === dateStr)
    const isPast = date < new Date(today.toDateString())
    const isSelected = selectedDate.toDateString() === date.toDateString()

    const classes = []
    if (isSelected) classes.push('selected')
    if (isToday) classes.push('now')
    if (hasSlot) classes.push('available')
    else classes.push('unavailable')
    if (isPast) classes.push('disabled')

    return classes.join(' ')
  }

  const getSlotsForDate = (date: Date) => {
    const dateStr = formatDate(date)
    return availabilities.find(a => a.date === dateStr)?.slots || []
  }

  const handleDateSelect = (value: Date) => {
    setSelectedDate(value)
    setSelectedSlot(null)
  }

  const handleTimeSelect = (slot: AppointmentSlot) => {
    setSelectedDate(new Date(slot.date))
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

  const isDatePast = (date: Date): boolean => {
    const today = new Date()
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
  }

  const fetchAvailabilities = async () => {
    await axiosInstance
      .get<DailyAvailability[]>('/api/appointments/slots')
      .then(response => {
        const data = response.data
        setAvailabilities(data)
        if (data.length > 0) {
          const todayStr = formatDate(new Date())
          const todayAvailability = data.find(a => a.date === todayStr)
          if (todayAvailability && todayAvailability.slots.length > 0) {
            setSelectedDate(new Date(todayAvailability.date))
            setSelectedSlot(todayAvailability.slots[0])
          } else {
            const firstAvailable = data.find(a => a.slots.length > 0)
            if (firstAvailable) {
              setSelectedDate(new Date(firstAvailable.date))
              setSelectedSlot(firstAvailable.slots[0])
            }
          }
        } else {
          setSelectedDate(new Date())
          setSelectedSlot(null)
        }
      })
      .catch(error => {
        console.error('Error fetching availabilities:', error)
        toast.error(t('calendar.fetchError'))
        setAvailabilities([])
      })
  }

  useEffect(() => {
    fetchAvailabilities()
  }, [])

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
              value={selectedDate}
              tileClassName={({ date }) => getTileClassName(date)}
              minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
              maxDate={new Date(new Date().setDate(new Date().getDate() + 14))}
            />
          </div>

          <div className='w-full sm:w-1/2 md:w-1/3'>
            {selectedDate && isDatePast(selectedDate) ? (
              <div className='text-lg font-semibold mb-2'>
                {t('calendar.pastDateWarning')}
              </div>
            ) : (
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
                        {formatDate(selectedDate)}
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
