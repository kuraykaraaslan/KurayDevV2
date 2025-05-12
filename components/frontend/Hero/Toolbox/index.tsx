"use client";
import {
  faHtml5,
  faPython,
  faPhp,
  faJava,
  faLinux,
  faFigma,
  faCss3,
  faSquareJs,
  faNodeJs,
  faReact,
} from "@fortawesome/free-brands-svg-icons";
import {
  faArchway,
  faCode,
  faCodeBranch,
  faDatabase,
  faLightbulb,
  faUsers,
  IconDefinition,
  faServer,
  faKey,
  faCodeMerge,
  faProjectDiagram,
  faRocket,
  faStream,
  faDrum,
  faMoneyBill,
  faCogs,
  faBugSlash,
  faTasks,
  faCircleCheck,
  faCircleXmark,
  faCloud,
  faVial,
} from "@fortawesome/free-solid-svg-icons";
import React from "react";

import SingleTool from "./Partials/SingleTool";
import SingleSkill from "./Partials/SingleSkill";
import Tool from "@/types/Tool";
import Skill from "@/types/Skill";
import { useTranslation } from "react-i18next";

const Toolbox = () => {


  const customTSIcon: IconDefinition = {
    prefix: 'fab',
    //@ts-ignore
    iconName: 'typescript',
    icon: [
      32,
      32,
      [],
      "f0c8",
      "M0 16v16h32v-32h-32zM25.786 14.724c0.813 0.203 1.432 0.568 2.005 1.156 0.292 0.312 0.729 0.885 0.766 1.026 0.010 0.042-1.38 0.974-2.224 1.495-0.031 0.021-0.156-0.109-0.292-0.313-0.411-0.599-0.844-0.859-1.505-0.906-0.969-0.063-1.594 0.443-1.589 1.292-0.005 0.208 0.042 0.417 0.135 0.599 0.214 0.443 0.615 0.708 1.854 1.245 2.292 0.984 3.271 1.635 3.88 2.557 0.682 1.031 0.833 2.677 0.375 3.906-0.51 1.328-1.771 2.234-3.542 2.531-0.547 0.099-1.849 0.083-2.438-0.026-1.286-0.229-2.505-0.865-3.255-1.698-0.297-0.323-0.87-1.172-0.833-1.229 0.016-0.021 0.146-0.104 0.292-0.188s0.682-0.396 1.188-0.688l0.922-0.536 0.193 0.286c0.271 0.411 0.859 0.974 1.214 1.161 1.021 0.542 2.422 0.464 3.115-0.156 0.281-0.234 0.438-0.594 0.417-0.958 0-0.37-0.047-0.536-0.24-0.813-0.25-0.354-0.755-0.656-2.198-1.281-1.651-0.714-2.365-1.151-3.010-1.854-0.406-0.464-0.708-1.010-0.88-1.599-0.12-0.453-0.151-1.589-0.057-2.042 0.339-1.599 1.547-2.708 3.281-3.036 0.563-0.109 1.875-0.068 2.427 0.068zM18.276 16.063l0.010 1.307h-4.167v11.839h-2.948v-11.839h-4.161v-1.281c0-0.714 0.016-1.307 0.036-1.323 0.016-0.021 2.547-0.031 5.62-0.026l5.594 0.016z"

    ],
  };

  const customRedisIcon: IconDefinition = {
    prefix: 'fab',
    //@ts-ignore
    iconName: 'redis',
    icon: [
      256, // width (viewBox genişliği)
      256, // height (viewBox yüksekliği, -18'lik offset yok sayıldı)
      [],
      "custom-drum-icon", // key (özelleştirilebilir bir identifier)
      "M245.97 168.943c-13.662 7.121-84.434 36.22-99.501 44.075-15.067 7.856-23.437 7.78-35.34 2.09-11.902-5.69-87.216-36.112-100.783-42.597C3.566 169.271 0 166.535 0 163.951v-25.876s98.05-21.345 113.879-27.024c15.828-5.679 21.32-5.884 34.79-.95 13.472 4.936 94.018 19.468 107.331 24.344l-.006 25.51c.002 2.558-3.07 5.364-10.024 8.988zM245.965 143.22c-13.661 7.118-84.431 36.218-99.498 44.072-15.066 7.857-23.436 7.78-35.338 2.09-11.903-5.686-87.214-36.113-100.78-42.594-13.566-6.485-13.85-10.948-.524-16.166 13.326-5.22 88.224-34.605 104.055-40.284 15.828-5.677 21.319-5.884 34.789-.948 13.471 4.934 83.819 32.935 97.13 37.81 13.316 4.881 13.827 8.9.166 16.02zM245.97 127.074c-13.662 7.122-84.434 36.22-99.501 44.078-15.067 7.853-23.437 7.777-35.34 2.087-11.903-5.687-87.216-36.112-100.783-42.597C3.566 127.402 0 124.67 0 122.085V96.206s98.05-21.344 113.879-27.023c15.828-5.679 21.32-5.885 34.79-.95 13.473 4.935 94.019 19.464 107.331 24.341l-.006 25.513c.002 2.557-3.07 5.363-10.024 8.987zM245.965 101.351c-13.661 7.12-84.431 36.218-99.498 44.075-15.066 7.854-23.436 7.777-35.338 2.087-11.903-5.686-87.214-36.112-100.78-42.594-13.566-6.483-13.85-10.947-.524-16.167C23.151 83.535 98.05 54.148 113.88 48.47c15.828-5.678 21.319-5.884 34.789-.949 13.471 4.934 83.819 32.933 97.13 37.81 13.316 4.88 13.827 8.9.166 16.02zM245.97 83.653c-13.662 7.12-84.434 36.22-99.501 44.078-15.067 7.854-23.437 7.777-35.34 2.087-11.903-5.687-87.216-36.113-100.783-42.595C3.566 83.98 0 81.247 0 78.665v-25.88s98.05-21.343 113.879-27.021c15.828-5.68 21.32-5.884 34.79-.95C162.142 29.749 242.688 44.278 256 49.155l-.006 25.512c.002 2.555-3.07 5.361-10.024 8.986zM245.965 57.93c-13.661 7.12-84.431 36.22-99.498 44.074-15.066 7.854-23.436 7.777-35.338 2.09C99.227 98.404 23.915 67.98 10.35 61.497-3.217 55.015-3.5 50.55 9.825 45.331 23.151 40.113 98.05 10.73 113.88 5.05c15.828-5.679 21.319-5.883 34.789-.948 13.471 4.935 83.819 32.934 97.13 37.811 13.316 4.876 13.827 8.897.166 16.017zM159.283 32.757l-22.01 2.285-4.927 11.856-7.958-13.23-25.415-2.284 18.964-6.839-5.69-10.498 17.755 6.944 16.738-5.48-4.524 10.855 17.067 6.391zM131.032 90.275L89.955 73.238l58.86-9.035-17.783 26.072zM74.082 39.347c17.375 0 31.46 5.46 31.46 12.194 0 6.736-14.085 12.195-31.46 12.195s-31.46-5.46-31.46-12.195c0-6.734 14.085-12.194 31.46-12.194zM185.295 35.998l34.836 13.766-34.806 13.753-.03-27.52zM146.755 51.243l38.54-15.245.03 27.519-3.779 1.478-34.791-13.752z"
    ]
  };

  const { t } = useTranslation();

  const backendTools = [
    {
      icon: faJava,
      hoverBgColor: "bg-red-500",
      title: "Java",
      description: "spring & swing",
      hoverTextColor: "text-black"
    },
    {
      icon: faNodeJs,
      hoverBgColor: "bg-green-500",
      title: "Node.js",
      description: "express & next",
      hoverTextColor: "text-black",
    },
    {
      icon: faPhp,
      hoverBgColor: "bg-purple-500",
      title: "PHP",
      description: "laravel",
      hoverTextColor: "text-black",
    },
    {
      icon: faLinux,
      hoverBgColor: "bg-yellow-500",
      title: "Linux",
      description: "server, bash",
      hoverTextColor: "text-black",
    },
  ] as Tool[];

  const frontendTools = [
    {
      icon: faReact,
      hoverBgColor: "bg-cyan-500",
      title: "React",
      description: "react & native & next",
      hoverTextColor: "text-black",
    },
    {
      icon: faCss3,
      hoverBgColor: "bg-blue-500",
      title: "CSS",
      description: "tailwind & scss",
      hoverTextColor: "text-black",
    },
    {
      icon: faHtml5,
      hoverBgColor: "bg-orange-500",
      title: "HTML",
      description: "semantic",
      hoverTextColor: "text-black",
    },
    {
      icon: faFigma,
      hoverBgColor: "bg-rose-500",
      title: "Figma",
      description: "design",
      hoverTextColor: "text-black",
    },
  ] as Tool[];

  const skillGroupColors = {
    fundamentals: {
      bgColor: "bg-cyan-700",
      textColor: "text-white",
    },
    backend: {
      bgColor: "bg-violet-700",
      textColor: "text-white",
    },
    advanced: {
      bgColor: "bg-emerald-700",
      textColor: "text-white",
    },
  };

  const professionalSkills: Skill[] = [
    {
      icon: faCode,
      title: "Clean Code",
      ...skillGroupColors.fundamentals,
    },
    {
      icon: faKey,
      title: "Authentication & Security",
      ...skillGroupColors.fundamentals,
    },
    {
      icon: faCogs,
      title: "REST API Design",
      ...skillGroupColors.backend,
    },
    {
      icon: faDatabase,
      title: "SQL & Data Modeling",
      ...skillGroupColors.backend,
    },
    {
      icon: faProjectDiagram,
      title: "Multi-Tenant SaaS",
      ...skillGroupColors.backend,
    },
    {
      icon: customRedisIcon,
      title: "Caching with Redis",
      ...skillGroupColors.backend,
    },
    {
      icon: faMoneyBill,
      title: "Payment Systems",
      ...skillGroupColors.backend,
    },
    {
      icon: faVial,
      title: "Testing & CI/CD",
      ...skillGroupColors.advanced,
    },
    {
      icon: faRocket,
      title: "Performance Optimization",
      ...skillGroupColors.advanced,
    },
    {
      icon: faCloud,
      title: "Cloud Infrastructure (AWS)",
      ...skillGroupColors.advanced,
    },
    {
      icon: faStream,
      title: "Event-Driven Architecture",
      ...skillGroupColors.advanced,
    },
    {
      icon: faArchway,
      title: "Domain-Driven Design",
      ...skillGroupColors.advanced,
    }
  ];



  return (
    <>
      <section className="hero bg-base-300 py-8 px-4 md:px-20 px-4 items-center justify-center align-middle min-h-screen">
        <div className="">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 ">
            <div className="col-span-2 md:col-span-1 md:col-start-3 overflow-hidden">
              <h1 className="text-4xl lg:text-3xl font-bold mt-6 text-center md:text-right">
                {t("toolbox.title")}
              </h1>
            </div>
            <div className="col-span-1 md:col-start-4 invisible md:visible hidden md:block">
              <p className="mt-6 pr-4">
                {t("toolbox.description")}
              </p>
            </div>
          </div>

          <div className="grid grid-row-auto justify-items-center grid-row-1 md:grid-row-2 md:space-y-8 py-8 md:py-16">
            <div className="flex flex-col lg:flex-row-reverse md:mx-12 mx-auto">
              <div className="flex-1 pl-4 select-none hidden lg:block">
                <h1 className="text-3xl font-bold  relative overflow-hidden animate-shake pb-4">
                  Frontend
                </h1>
              </div>
              <div className="group flex-none grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {frontendTools.map((tool, index) => (
                  <SingleTool key={index} {...tool} />
                ))}
              </div>
            </div>
            <div className="group flex flex-col lg:flex-row md:mx-12 mx-auto pt-4">
              <div className="flex-0 lg:pl-0 select-none hidden lg:block pr-4">
                <h1 className="text-3xl font-bold  relative overflow-hidden animate-shake pb-4">
                  Backend
                </h1>
              </div>
              <div className="flex-none grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {backendTools.map((tool, index) => (
                  <SingleTool key={index} {...tool} />
                ))}
              </div>
            </div>
            <div className="w-50 h-50 group border-gray-500 border-t w-40 mt-8"></div>

            <div className="group flex-none grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-8 mt-4">
              {professionalSkills.map((skill, index) => {
                // if key is bigger than 14 then hide on mobile
                if (index > 14) {
                  skill.className = skill.className + " hidden md:inline";
                }
                return (
                  <SingleSkill
                    key={index}
                    {...skill}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Toolbox;
