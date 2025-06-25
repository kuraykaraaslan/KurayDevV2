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
        toast.success('Randevu oluşturuldu!')
        fetchAvailabilities() // slot'u yenile
        document.getElementById('my_modal_1')?.close()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error('İşlem sırasında bir hata oluştu.')
    }
  }

  const isDatePast = (date: Date): boolean => {
    const today = new Date()
    return (
      date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    )
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

                  {/* Open the modal using document.getElementById('ID').showModal() method */}
                  <button
                    className='btn btn-primary btn-block mt-4'
                    onClick={() =>
                      document.getElementById('my_modal_1').showModal()
                    }
                  >
                    <FontAwesomeIcon icon={faCalendar} className='mr-2' />
                    {t('calendar.bookAppointment')}
                  </button>

                  <dialog id='my_modal_1' className='modal'>
                    <div className='modal-box'>
                      <h3 className='font-bold text-lg mb-4'>
                        {t('calendar.bookAppointment')}
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
                          <FontAwesomeIcon
                            icon={faStopwatch}
                            className='mr-2'
                          />
                          {t('calendar.minutes', {
                            count: selectedSlot.length || 30
                          })}
                        </span>
                      </p>
                      <form onSubmit={handleFormSubmit} className='mt-4'>
                        <div className='mb-2'>
                          <label className='label'>
                            <span className='label-text'>
                              {t('calendar.name')}
                            </span>
                          </label>
                          <input
                            type='text'
                            name='name'
                            required
                            placeholder={t('calendar.namePlaceholder')}
                            className='input input-bordered w-full mb-2'
                          />
                        </div>
                        <div className='mb-2'>
                          <label className='label'>
                            <span className='label-text'>
                              {t('calendar.email')}
                            </span>
                          </label>
                          <input
                            type='email'
                            name='email'
                            required
                            placeholder={t('calendar.emailPlaceholder')}
                            className='input input-bordered w-full mb-2'
                          />
                        </div>
                        <div className='mb-2'>
                          <label className='label'>
                            <span className='label-text'>
                              {t('calendar.phone')}
                            </span>
                          </label>
                          <input
                            type='tel'
                            name='phone'
                            required
                            placeholder={t('calendar.phonePlaceholder')}
                            className='input input-bordered w-full mb-2'
                          />
                        </div>
                        <div className='mb-2'>
                          <label className='label'>
                            <span className='label-text'>
                              {t('calendar.note')}
                            </span>
                          </label>
                          <textarea
                            name='note'
                            placeholder={t('calendar.notePlaceholder')}
                            className='textarea textarea-bordered w-full mb-2'
                            rows={3}
                          ></textarea>
                        </div>

                        <button
                          type='submit'
                          className='btn btn-primary w-full'
                        >
                          {t('calendar.bookAppointment')}
                        </button>
                      </form>
                      <div className='modal-action w-full'>
                        <form method='dialog' className='w-full'>
                          {/* if there is a button in form, it will close the modal */}
                          <button className='btn btn-secondary btn-block'>
                            {t('calendar.close')}
                          </button>
                        </form>
                      </div>
                    </div>
                  </dialog>
                </>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
