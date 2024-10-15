import React from "react";
import {
  faReact,
  faBootstrap,
  faHtml5,
  faPython,
  faPhp,
  faJava,
  faJs,
  faAmazon,
  faAndroid,
  faChrome,
  faOpera,
  faApple,
  faGithub,
  faGit,
} from "@fortawesome/free-brands-svg-icons";
import {
  faAnchor,
  faAnglesDown,
  faAnglesUp,
  faFire,
  faGear,
  faGlobe,
  faMobileScreenButton,
  faTv,
  faWind,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

//i18n
import { withTranslation } from "react-i18next";
import SingleProject from "./Partials/SingleProject";
import Link from "next/link";
import Project from "@/types/Project";

const ProjectsHero = () => {

  const otherProjectsImageHTML =
    `<div class="w-full h-48 bg-base-100 rounded-t-lg flex items-center justify-center select-none">
  <a href="https://github.com/kuraykaraaslan" class="flex items-center gap-2 p-4">
    <img src="/assets/svg/github.svg" alt="GitHub" class="w-12 h-12 object-cover object-center rounded-lg" />
    <span class="text-xl font-bold">/kuraykaraaslan</span>
  </a>
  </div>`;

  const projects: Project[] = [
    {
      id: "1",
      image: "/assets/img/projects/pegasus.png",
      title: "Pegasus UI Kit",
      description:
        "Pegasus is a React UI Kit that is built using Tailwind CSS. It offers a responsive and user-friendly interface for an optimal experience.",
      urls: [
        { type: "GitHub", url: "https://github.com/kuraykaraaslan/pegasus" },
        { type: "Demo", url: "https://pegasus.kuray.dev" },
      ],
      tags: [
        { name: "React", color: "bg-blue-300", icon: faReact },
        { name: "Tailwind", color: "bg-blue-500", icon: faWind },
      ],
    },
    {
      id: "2",
      image: "https://github.com/kuraykaraaslan/expo-react-redux-boilerplate/raw/main/static/logo.png",
      title: "Expo React Redux Boilerplate",
      description:
        "It provides a solid foundation for creating cross-platform mobile apps with a predictable state container for managing application data flow.",
      urls: [
        {
          type: "GitHub",
          url: "https://github.com/kuraykaraaslan/expo-react-redux-boilerplate",
        },
      ],
      tags: [{ name: "React Native", color: "bg-blue-300", icon: faReact }],
    },
    {
      id: "9",
      image: "https://raw.githubusercontent.com/kuraykaraaslan/control-view-cube/main/static/donut.gif",
      title: "3D View Cube",
      description:
        "3D View Cube is a 3D cube that is built using React and WebGL. It is a simple application that allows users to rotate the cube in 3D space.",
      urls: [
        {
          type: "GitHub",
          url: "https://github.com/kuraykaraaslan/control-view-cube",
        },
        {
          type: "Other",
          title: "npm",
          url: "https://www.npmjs.com/package/control-view-cube",
        },
      ],
      tags: [
        { name: "React", color: "bg-blue-300", icon: faReact },
        { name: "WebGL", color: "bg-yellow-300", icon: faGlobe },
      ],
    },
    {
      id: "10",
      title: "Other Projects",
      description:
        "For other projects, check my GitHub profile. You can find various projects that I have worked on.",
      urls: [
        {
          type: "Other",
          title: "GitHub",
          url: "https://github.com/kuraykaraaslan/",
        },
      ],
      tags: [
        { name: "Desktop", color: "bg-yellow-300", icon: faTv },
        { name: "Mobile", color: "bg-green-300", icon: faMobileScreenButton },
        { name: "Web", color: "bg-blue-300", icon: faGlobe },
      ],
      bgColor: "bg-base-300",
      imageHtml: otherProjectsImageHTML,
    },
  ];

  return (
    <>
      <section className="min-h-screen pt-24" id="#projects">
        <div
          className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000"        >
          <div className="mx-auto max-w-screen-sm text-center lg:mb-16 mb-8 -mt-8 lg-mt-0">
            <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold">
              Projects
            </h2>
            <p className="font-light sm:text-xl">
              Here are some of the projects that I developed as hobby or for learning purposes.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {projects.map((project: Project) => (
              <SingleProject key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProjectsHero;
