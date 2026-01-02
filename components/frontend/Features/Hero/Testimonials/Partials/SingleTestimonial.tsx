import {Testimonial} from '@/types/ui/TestimonialTypes';

const SingleTestimonial = ({ testimonial }: { testimonial: Testimonial }) => {
    return (
      <div className="p-6 rounded shadow-md bg-base-100">
        <p>{testimonial.review}</p>
        <div className="flex items-center mt-4 space-x-4">
          <div className="w-12 h-12 bg-center bg-cover rounded-full bg-base-500">
            <div className="flex items-center justify-center w-full h-full text-2xl font-bold rounded-full">
              {testimonial.name[0]}
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold">{testimonial.name}</p>
            <p className="text-sm">{testimonial.title}</p>
          </div>
        </div>
      </div>
    );
  }

export default SingleTestimonial;

  