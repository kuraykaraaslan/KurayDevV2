"use client";
import { useRef } from "react";
import {
  faApple,
  faAndroid,
  faReact,
  faPhp,
  faJava
} from "@fortawesome/free-brands-svg-icons";
import {
  faDesktop,
  faGlobe,
  faWind,
} from "@fortawesome/free-solid-svg-icons";

import SingleService, { Service } from "./Partials/SingleService";

const Services = () => {
  const container = useRef(null);
  const projects: Service[] = [
    {
      id: "1",
      image: "/assets/img/services/phone.jpg",
      title: "Mobile App Development",
      description:
        "I develop mobile applications for both Android and iOS platforms. i use the latest technologies and tools to deliver high-quality applications.",
      urls: [
      ],
      tags: [
        { name: "Android", color: "bg-green-200", icon: faAndroid },
        { name: "Apple", color: "bg-blue-200", icon: faApple },
        { name: "React Native", color: "bg-blue-200", icon: faReact },
      ],
    },
    {
      id: "2",
      image: "/assets/img/services/web.jpg",
      title: "Web Development",
      description:
        "I can help you build a website or web app using React, Next.js that looks great on all devices.",        
      urls: [
      ],
      tags: [
        { name: "React", color: "bg-blue-200", icon: faReact },
        { name: "Web", color: "bg-yellow-200", icon: faGlobe },
        { name: "Desktop", color: "bg-yellow-200", icon: faDesktop },
      ],
    },
    {
      id: "3",
      image: "/assets/img/services/admin.jpg",
      title: "Backend Development",
      description:
        "Have a project that requires a backend? I can help you build a scalable and secure backend using Node.js, Express, and Postgresql.",
      urls: [],
      tags : [
        { name: "Node.js", color: "bg-green-200", icon: faWind },
        { name: "PHP", color: "bg-purple-200", icon: faPhp },
        { name: "Java", color: "bg-red-200", icon: faJava }
      ]
    },
    {
      id: "4",
      image: "/assets/img/services/other2.jpg",
      title: "Something Else",
      bgColor: "bg-base-200",
      description:
        "I  can help you with your custom software development needs. Contact us to discuss your project. like setting up a CI/CD pipeline, writing tests, or deploying your app.",
      urls: [],
      tags: []
    }
  ];

  return (
    <>
      <section className="bg-base-100 pt-16" id="projects">
        <div
          className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000"
          ref={container}
        >
          <div className="mx-auto max-w-screen-sm text-center lg:mb-16 mb-8 -mt-8 lg-mt-0">
            <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold">
            My Services
            </h2>
            <p className="font-light sm:text-xl">i offer a wide range of services to help you build your dream project.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {projects.map((service: Service) => (
              <SingleService key={service.id} service={service} />
            ))}
          </div>
        </div>

        <div
          className="flex carousel-indicators gap-2 bg-transparent select-none"
          style={{
            zIndex: 50,
            position: "relative",
            left: "0",
            right: "0",
            margin: "auto",
            height: "0px",
            width: "100%",
            bottom: "20",
            display: "flex",
            justifyContent: "center",
          }}
        >
        </div>
      </section>
    </>
  );
};

export default Services;