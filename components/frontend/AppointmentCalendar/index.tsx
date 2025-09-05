'use client'

import React, { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import './style.css'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import useGlobalStore from '@/libs/zustand'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendar,
  faClock,
  faStopwatch
} from '@fortawesome/free-solid-svg-icons'
import type Value from 'react-calendar'

import { AppointmentSlot, DailyAvailability } from '@/types/CalendarTypes'

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

  // @ts-ignore
  const handleDateSelect = ( value: Value,
    event?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (value instanceof Date) {
      setSelectedDate(value)
      setSelectedSlot(null)
    }
  }

  const handleTimeSelect = (slot: AppointmentSlot) => {
    setSelectedDate(new Date(slot.date))
    setSelectedSlot(slot)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget as HTMLFormElement)
    const name = data.get('name') as string
    const email = data.get('email') as string
    const phone = data.get('phone') as string
    const note = data.get('note') as string

    if (!selectedSlot) return

    try {
      const response = await axiosInstance.post('/api/appointments/book', {
        name,
        email,
        phone,
        note,
        slot: selectedSlot
      })

      if (response.data.success) {
        toast.success(t('calendar.success'))
        fetchAvailabilities()
        // @ts-ignore
        document.getElementById('my_modal_1')?.close()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(t('calendar.error'))
    }
  }

  const isDatePast = (date: Date): boolean => {
    const today = new Date()
    return (
      date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    )
  }

  const fetchAvailabilities = async () => {
    try {
      const response = await axiosInstance.get<DailyAvailability[]>(
        '/api/appointments/slots'
      )
      const data = response.data
      setAvailabilities(data)

      if (data.length > 0) {
        const todayStr = formatDate(new Date())
        const todayAvailability = data.find(a => a.date === todayStr)

        if (todayAvailability?.slots?.length) {
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
    } catch (error) {
      console.error('Error fetching availabilities:', error)
      toast.error(t('calendar.fetchError'))
      setAvailabilities([])
    }
  }

  useEffect(() => {
    fetchAvailabilities()
  }, [])

  return (
    <section className='bg-base-200 pt-16' id='portfolio'>
      <div className='px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000'>
        <div className='mx-auto max-w-screen-sm text-center -mt-8 lg:mt-0'>
          <h2 className='mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold'>
            {t('calendar.title')}
          </h2>
          <p className='font-light sm:text-xl'>{t('calendar.description')}</p>
        </div>

        <div className='flex flex-wrap justify-center gap-4 mb-8 mt-3'>
          {/* Takvim */}
          <div className='w-1/2 sm:w-1/3 md:w-1/4'>
            <Calendar
              onChange={handleDateSelect}
              value={selectedDate}
              tileClassName={({ date }) => getTileClassName(date)}
              minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
              maxDate={new Date(new Date().setDate(new Date().getDate() + 14))}
            />
          </div>

          {/* Slot seçimi ve form */}
          <div className='w-1/2 sm:w-1/3 md:w-1/4'>
            {isDatePast(selectedDate) ? (
              <div className='text-lg font-semibold mb-2'>
                {t('calendar.past_date_warning')}
              </div>
            ) : (
              <>
                <h3 className='text-lg font-semibold mb-2'>
                  {t('calendar.available_slots')}
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
              </>
            )}

            {selectedSlot ? (
              <div className='mt-4'>
                <h3 className='text-lg font-semibold mb-2'>
                  {t('calendar.selected_slot')}
                </h3>
                <p className='text-sm space-x-2'>
                  <span className='font-semibold'>
                    <FontAwesomeIcon icon={faCalendar} className='mr-2' />
                    {formatDate(selectedDate)}
                  </span>
                  <span className='font-semibold'>
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

                <button
                  className='btn btn-primary btn-block mt-4'
                  onClick={() => {
                    // @ts-ignore
                    document.getElementById('my_modal_1')?.showModal()
                  }}
                >
                  <FontAwesomeIcon icon={faCalendar} className='mr-2' />
                  {t('calendar.book_appointment')}
                </button>
              </div>
            ) : (
              <div className='mt-4 text-lg'>{t('calendar.select_slot')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <dialog id='my_modal_1' className='modal'>
        <div className='modal-box'>
          <h3 className='font-bold text-lg mb-4'>
            {t('calendar.book_appointment')}
          </h3>

          <p className='text-sm space-x-2 mb-4'>
            <span className='font-semibold'>
              <FontAwesomeIcon icon={faCalendar} className='mr-2' />
              {formatDate(selectedDate)}
            </span>
            <span className='font-semibold'>
              <FontAwesomeIcon icon={faClock} className='mr-2' />
              {selectedSlot?.time}
            </span>
            <span className='font-semibold'>
              <FontAwesomeIcon icon={faStopwatch} className='mr-2' />
              {t('calendar.minutes', { count: selectedSlot?.length || 30 })}
            </span>
          </p>

          <form onSubmit={handleFormSubmit} className='space-y-3'>
            <div>
              <label className='label'>
                <span className='label-text'>{t('calendar.name')}</span>
              </label>
              <input
                type='text'
                name='name'
                required
                placeholder={t('calendar.name_placeholder')}
                className='input input-bordered w-full'
              />
            </div>

            <div>
              <label className='label'>
                <span className='label-text'>{t('calendar.email')}</span>
              </label>
              <input
                type='email'
                name='email'
                required
                placeholder={t('calendar.email_placeholder')}
                className='input input-bordered w-full'
              />
            </div>

            <div>
              <label className='label'>
                <span className='label-text'>{t('calendar.phone')}</span>
              </label>
              <input
                type='tel'
                name='phone'
                required
                placeholder={t('calendar.phone_placeholder')}
                className='input input-bordered w-full'
              />
            </div>

            <div>
              <label className='label'>
                <span className='label-text'>{t('calendar.note')}</span>
              </label>
              <textarea
                name='note'
                rows={3}
                placeholder={t('calendar.note_placeholder')}
                className='textarea textarea-bordered w-full'
              />
            </div>

            <button type='submit' className='btn btn-primary w-full'>
              {t('calendar.book_appointment')}
            </button>
          </form>

          <div className='modal-action'>
            <form method='dialog' className='w-full'>
              <button className='btn btn-secondary btn-block'>
                {t('calendar.close')}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </section>
  )
}
