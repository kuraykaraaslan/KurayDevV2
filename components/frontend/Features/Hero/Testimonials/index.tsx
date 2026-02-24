'use client'
import { useState, useEffect } from 'react'
import { Testimonial } from '@/types/ui/TestimonialTypes'
import axiosInstance from '@/libs/axios'
import SingleTestimonial from './Partials/SingleTestimonial'

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    axiosInstance
      .get('/api/testimonials?pageSize=100')
      .then((response) => {
        const all: Testimonial[] = response.data.testimonials ?? []
        setTestimonials(all.filter((t) => t.status === 'PUBLISHED'))
      })
      .catch((error) => {
        console.error(error)
      })
  }, [])

  if (!testimonials.length) return null

  const half = Math.ceil(testimonials.length / 2)
  const leftColumn = testimonials.slice(0, half)
  const rightColumn = testimonials.slice(half)

  return (
    <section className="bg-base-300 md:px-24">
      <div className="container px-6 py-4 mx-auto mx-4 pb-0 md:pb-20">
        <div className="grid items-center gap-4 xl:grid-cols-5">
          <div className="max-w-2xl mx-auto my-8 space-y-4 text-center xl:col-span-2 xl:text-left">
            <h2 className="text-4xl font-bold">What People Say</h2>
            <p className="">
              I&apos;ve worked with some amazing people and companies. Here&apos;s what they have to
              say about me.
            </p>
          </div>
          <div className="p-6 xl:col-span-3 pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid content-center gap-4">
                {leftColumn.map((testimonial) => (
                  <SingleTestimonial key={testimonial.testimonialId} testimonial={testimonial} />
                ))}
              </div>
              <div className="grid content-center gap-4">
                {rightColumn.map((testimonial) => (
                  <SingleTestimonial key={testimonial.testimonialId} testimonial={testimonial} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
