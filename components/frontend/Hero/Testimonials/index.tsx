import Testimonial from "@/types/Testimonial";
import SingleTestimonial from "./Partials/SingleTestimonial";

const Testimonials = () => {

  const testimonials = [
    {
      id: 1,
      name: "Michael Harris",
      title: "Founder at Bright Ventures",
      review: "We couldn't have asked for a better experience. The complex API integrations and custom features were delivered with precision. The professionalism and commitment to quality made a huge impact on our business.",
    },
    {
      id: 2,
      name: "Sarah Miller",
      title: "CTO at NextGen Solutions",
      review: "A true expert in software engineering who transformed our vision into reality. The technical expertise and understanding of our complex requirements made a huge difference in the success of our project.",
    },

    {
      id: 3,
      name: "Ahmet Yılmaz",
      title: "CTO at Akıllı Sistemler A.Ş.",
      review: "The software development process was seamless, and the e-commerce platform delivered exceeded our expectations. The attention to detail and ability to meet deadlines were impressive. Highly recommend for any technical project.",
    },
    {
      id: 4,
      name: "James Roberts",
      title: "Product Manager at Stellar Apps",
      review: "Kuray provided invaluable assistance in scaling our mobile app. His knowledge in React Native and backend development allowed us to launch ahead of schedule. His professionalism and problem-solving skills set him apart.",
    }
  ] as Testimonial[];

  return (
    <section className="bg-base-300 md:px-24">
      <div className="container px-6 py-4 mx-auto mx-4 pb-0 md:pb-20">
        <div className="grid items-center gap-4 xl:grid-cols-5">
          <div className="max-w-2xl mx-auto my-8 space-y-4 text-center xl:col-span-2 xl:text-left">
            <h2 className="text-4xl font-bold">What People Say</h2>
            <p className="">
            I've worked with some amazing people and companies. Here's what they have to say about me.
            </p>
          </div>
          <div className="p-6 xl:col-span-3 pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid content-center gap-4">
                {testimonials.map((testimonial) => {
                  if (testimonial.id <= 2) {
                    return <SingleTestimonial key={testimonial.id} testimonial={testimonial} />;
                  }
                })}
              </div>
              <div className="grid content-center gap-4">
                {testimonials.map((testimonial) => {
                  if (testimonial.id > 2) {
                    return <SingleTestimonial key={testimonial.id} testimonial={testimonial} />;
                  }
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
