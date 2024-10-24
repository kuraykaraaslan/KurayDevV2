'use client';
import React, { useState } from 'react';
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
  faU,
  faWind,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

//i18n
import { withTranslation } from "react-i18next";
import Link from "next/link";


import SinglePortfolio from './Partials/SinglePortfolio';
import Portfolio from '@/types/Portfolio';

const PortfolioHero = () => {

  const [filter, setFilter] = useState("");

  const [expanded, setExpanded] = React.useState(false);
  const container = React.useRef(null);

  const otherPortfoliosImageHTML =
    `<div class="w-full h-48 bg-base-100 rounded-t-lg flex items-center justify-center select-none">
  <a href="https://github.com/kuraykaraaslan" class="flex items-center gap-2 p-4">
    <img src="/assets/svg/github.svg" alt="GitHub" class="w-12 h-12 object-cover object-center rounded-lg" />
    <span class="text-xl font-bold">/kuraykaraaslan</span>
  </a>

  </div>`;

  const portfolios: Portfolio[] = [
    {
      id: "0",
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
        { name: "UI/UX", color: "bg-purple-300", icon: faX },
      ],
    },
    {
      id: "1",
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
      tags: [{ name: "React Native", color: "bg-blue-300", icon: faReact },
      { name: "UI/UX", color: "bg-purple-300", icon: faX }],
    },
    {
      id: "2",
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
        { name: "npm", color: "bg-red-300", icon: faAnchor },
      ],
    },
    {
      id: "3",
      image: "https://github.com/kuraykaraaslan/Sozlesmeci/raw/main/static/main.gif",
      title: "Sözleşmeci",
      description:
        "Sözleşmeci is a contract generator that allows users to create, customize, and print professional contracts with ease. Built using React, it offers a responsive and user-friendly interface for an optimal experience."
        ,      
      tags: [
        { name: "React", color: "bg-blue-300", icon: faReact },
        { name: "Firebase", color: "bg-yellow-300", icon: faFire },
        { name: "UI/UX", color: "bg-purple-300", icon: faX },
      ],
    },
    {
      id: "4",
      image: "https://github.com/kuraykaraaslan/SecondLanguage/raw/main/static/main.gif",
      title: "Second Language",
      description:
        "a Language learning app that allows users to learn a new language by listening to the pronunciation of words and phrases.",
      tags: [
        { name: "React", color: "bg-blue-300", icon: faReact },
        { name: "Firebase", color: "bg-yellow-300", icon: faFire },
        { name: "Android", color: "bg-green-300", icon: faAndroid },
      ],
    },
    {
      id: "5",
      image: "https://github.com/kuraykaraaslan/InstaFollowStudio/raw/main/static/logo.png",
      title: "Instagram Follow Studio",
      description:
        "Instagram Follow Studio is a Chrome extension that allows you to follow and unfollow people on Instagram automatically. Listing them in a table, the extension allows you to follow and unfollow people in a controlled manner.",
      urls: [
        {
          type: "Other",
          title: "Chrome Web Store",
          url: "https://chromewebstore.google.com/detail/instagram-follow-studio/hokigbagphgdofjloccgkjoejpokjkcd",
        },
      ],
      tags: [
        { name: "React", color: "bg-blue-300", icon: faReact },
        { name: "Chrome", color: "bg-purple-300", icon: faChrome }
      ],
    },
    {
      id: "6",
      image: "https://github.com/kuraykaraaslan/Resume/raw/main/static/screenshot.gif",
      title: "Resume",
      description:
        "This open source application allows users to create, customize, and print professional resumes and CVs with ease. Built using React, it offers a responsive and user-friendly interface for an optimal experience.",
      urls: [
        { type: "GitHub", url: "https://github.com/kuraykaraaslan/Resume" },
        { type: "Demo", title: "Resume", url: "https://resume.kuray.dev" },
      ],
      tags: [{ name: "React", color: "bg-blue-300", icon: faReact },
      { name: "UI/UX", color: "bg-purple-300", icon: faX }],
    },
    {
      id: "7",
      image: "/assets/img/portfolios/tnyist.png",
      title: "tny.ist",
      description:
        "tny.ist is a free URL shortening service that provides companies and individuals with unique, customizable and secure links as well as analytics for the shortened links.",
      tags: [
        { name: "React", color: "bg-blue-300", icon: faReact },
        { name: "Firebase", color: "bg-yellow-300", icon: faFire },
        { name: "Android", color: "bg-green-300", icon: faAndroid },
      ],
    },
    {
      id: "8",
      image: "/assets/img/portfolios/datewave.png",
      title: "DateWave",
      description:
        "DateWave is a dating app that allows users to find their soulmates. The app is built using React Native and Firebase, and it is available on both Android and iOS.",
      urls: [
        { type: "GitHub", url: "https://github.com/kuraykaraaslan/Datewave" },
      ],
      tags: [
        { name: "React Native", color: "bg-blue-300", icon: faReact },
        { name: "Firebase", color: "bg-yellow-300", icon: faFire }
      ],
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
    }
  ];

  const continueOnGitHub: Portfolio =
  {
    id: "10",
    title: "Other Portfolios",
    description:
      "For other portfolios, check my GitHub profile. You can find various portfolios that I have worked on.",
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
    imageHtml: otherPortfoliosImageHTML,
  }


  const filterPortfolios = (portfolios: Portfolio[], filter: string) => {
    if (filter === "") {
      return portfolios;
    } else {
      return portfolios.filter((portfolio) => {
        return portfolio.tags.some((tag) => tag.name === filter);
      });
    }
  }

  const handleClick = () => {
    // get container current height
    const panel = container?.current as unknown as HTMLElement;

    if (panel === null) return;

    //make height is auto
    panel.style.height = expanded ? "560px" : `${panel.scrollHeight + 80}px`;

    //toggle the state
    setExpanded(!expanded);
  };

  return (
    <>
      <section className="bg-base-200 pt-16" id="projects">
        <div
          className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000"
          style={{ height: "560px", overflow: "clip" }}
          ref={container}
        >
          <div className="mx-auto max-w-screen-sm text-center lg:mb-8 -mt-8 lg:mt-0 ">
            <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold">
              Portfolio
            </h2>
            <p className="font-light sm:text-xl">
              My professional portfolios that I have worked on.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-8 mt-3">
            <button
              className={`btn btn-primary ${filter === "" ? "btn-active" : ""}`}
              onClick={() => setFilter("")}
            >
              All
            </button>
            <button
              className={`btn btn-primary ${filter === "UIUX" ? "btn-active" : ""}`}
              onClick={() => setFilter("UI/UX")}
            >
              UI/UX
            </button>
            <button
              className={`btn btn-primary ${filter === "React Native" ? "btn-active" : ""}`}
              onClick={() => setFilter("React Native")}
            >
              Mobile
            </button>
            <button
              className={`btn btn-primary ${filter === "Desktop" ? "btn-active" : ""}`}
              onClick={() => setFilter("Desktop")}
            >
              Desktop
            </button>
            <button
              className={`btn btn-primary ${filter === "React" ? "btn-active" : ""}`}
              onClick={() => setFilter("React")}
            >
              Web
            </button>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {filterPortfolios(portfolios, filter).map((portfolio) => (
              <SinglePortfolio key={portfolio.id} portfolio={portfolio} />
            ))}
            <SinglePortfolio key={continueOnGitHub.id} portfolio={continueOnGitHub} />
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
          <div
            className="flex carousel-indicators gap-2 bg-gradient-to-b from-base-200/20 to-base-300"
            style={{
              zIndex: 50,
              position: "relative",
              left: "0",
              right: "0",
              margin: "auto",
              height: "80px",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              transform: "translateY(-80px)",
            }}
          >
            {!expanded ? (
              <button
                className="flex flex-col items-center gap-2 animate-bounce"
                style={{ height: "80px", width: "130px" }}
                onClick={handleClick}
              >
                <FontAwesomeIcon
                  icon={faAnglesDown}
                  style={{
                    width: "2.0rem",
                    height: "2.0rem",
                  }}
                />{" "}
                <span>{expanded ? "Show Less" : "Show More"}</span>
              </button>
            ) : (
              <button
                className="flex flex-col items-center gap-2"
                style={{ height: "80px", width: "130px" }}
                onClick={handleClick}
              >
                <FontAwesomeIcon
                  icon={faAnglesUp}
                  style={{ width: "2.0rem", height: "2.0rem" }}
                />{" "}
                <span>{expanded ? "Show Less" : "Show More"}</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default PortfolioHero;
