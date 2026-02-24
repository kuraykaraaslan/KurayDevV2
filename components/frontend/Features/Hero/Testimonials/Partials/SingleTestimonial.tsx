import { Testimonial } from '@/types/ui/TestimonialTypes'
import Image from 'next/image'

const SingleTestimonial = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <div className="p-6 rounded shadow-md bg-base-100">
      <p>{testimonial.review}</p>
      <div className="flex items-center mt-4 space-x-4">
        <div className="w-12 h-12 bg-center bg-cover rounded-full bg-base-500 overflow-hidden shrink-0">
          {testimonial.image ? (
            <Image
              src={testimonial.image}
              alt={testimonial.name}
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-2xl font-bold rounded-full">
              {testimonial.name[0]}
            </div>
          )}
        </div>
        <div>
          <p className="text-lg font-semibold">{testimonial.name}</p>
          <p className="text-sm">{testimonial.title}</p>
        </div>
      </div>
    </div>
  )
}

export default SingleTestimonial
