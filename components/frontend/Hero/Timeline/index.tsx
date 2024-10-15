"use client";
import { createRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect } from "react";
import {
  faBaby,
  faBriefcase,
  faBuildingColumns,
  faCode,
  faComputer,
  faFaceSmile,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { faChrome, faFirefox } from "@fortawesome/free-brands-svg-icons";

const Timeline = () => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <>
      <section
        className={
          "bg-base-200 justify-center items-center flex flex-col select-none px-10 transition-all duration-300"
        }
        id="timeline"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="relative w-full h-full items-center justify-center flex flex-col">
          {/* Apply blur effect only to this section */}
          <div
            className="absolute inset-0 bg-base-200 bg-opacity-50 backdrop-filter backdrop-blur-sm items-center justify-center flex flex-col"
            style={{
              zIndex: 5,
              display: isHovering ? (showDetails ? "none" : "flex") : "none",
            }}
          >
            <h3 className="text-3xl font-bold text-center">
              Click on the timeline to see details
            </h3>
          </div>
          {/* Content inside the blurred section */}

          <ul
            className={
              "timeline bg-base-200 my-6" +
              (showDetails
                ? " timeline-vertical"
                : " timeline-vertical lg:timeline-horizontal")
            }
          >
            <li>
              <div className="timeline-start timeline-box max-w-xs mx-2">
                <p className="font-bold">Zero day</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i was born in 1996 in mersin, turkey. i was a very curious child and always wanted to learn new things.
                </p>
              </div>
              <div className="timeline-middle my-1">
                <div className="bg-white text-black rounded-full pt-1 px-1">
                  <FontAwesomeIcon
                    icon={faBaby}
                    style={{ width: "12px", height: "12px" }}
                    className="m-1 mt-1"
                  />
                </div>
              </div>
              <div className="timeline-end mx-2">
                1996
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-start mx-2">
                2002
              </div>
              <div className="timeline-middle my-1">
                <div className="bg-white text-black rounded-full pt-1 px-1">
                  <FontAwesomeIcon
                    icon={faComputer}
                    style={{ width: "12px", height: "12px" }}
                    className="m-1 mt-1"
                  />
                </div>
              </div>
              <div className="timeline-end timeline-box max-w-xs mx-2">
                <p className="font-bold">First Computer</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i started my education in mersin, turkey. i was a very curious child and always wanted to learn new things.
                </p>
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-start timeline-box max-w-xs mx-2">
                <p className="font-bold">Meet with the Internet</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i met the internet in 2005. i was amazed by the things i could do with it. i started learning how to use it and meet with linux.
                </p>
              </div>
              <div className="timeline-middle my-1">
                <div className="bg-white text-black rounded-full pt-1 px-1">
                  <FontAwesomeIcon
                    icon={faGlobe}
                    style={{ width: "12px", height: "12px" }}
                    className="m-1 mt-1"
                  />
                </div>
              </div>
              <div className="timeline-end mx-2">
                2005
              </div>
              <hr />
            </li>
            <li style={{ display: showDetails ? "grid" : "none" }}>
              <hr />
              <div className="timeline-start mx-2">
                2008
              </div>
              <div className="timeline-middle my-1">
                <div className="bg-white text-black rounded-full pt-1 px-1">
                  <FontAwesomeIcon
                    icon={faCode}
                    style={{ width: "12px", height: "12px" }}
                    className="m-1 mt-1"
                  />
                </div>
              </div>
              <div className="timeline-end timeline-box max-w-xs mx-2">
                <p className="font-bold">Started to Learn Programming</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i started coding in 2008. i learned html, css, and javascript. i built my first website and was hooked on coding
                </p>
              </div>
              <hr />
            </li>
            <li style={{ display: showDetails ? "grid" : "none" }}>
              <hr />
              <div className="timeline-start timeline-box max-w-xs mx-2">
                <p className="font-bold">First website</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i built my first website in 2010. it was a simple website for my school project. i was so proud of it.
                </p>
              </div>
              <div className="timeline-middle my-1">
                <div className="bg-white text-black rounded-full pt-1 px-1">
                  <FontAwesomeIcon
                    icon={faFirefox}
                    style={{ width: "12px", height: "12px" }}
                    className="m-1 mt-1"
                  />
                </div>
              </div>
              <div className="timeline-end mx-2">
                2010
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-start mx-2">
                2015
              </div>
              <div className="timeline-middle my-1">
                <div className="bg-white text-black rounded-full pt-1 px-1">
                  <FontAwesomeIcon
                    icon={faBuildingColumns}
                    style={{ width: "12px", height: "12px" }}
                    className="m-1 mt-1"
                  />
                </div>
              </div>
              <div className="timeline-end timeline-box max-w-xs mx-2">
                <p className="font-bold">University</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i started my university education in 2015. i studied civil engineering. i learned a lot of things about project management and teamwork.
                </p>
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-start timeline-box max-w-xs mx-2">
                <p className="font-bold">Changed my career</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i decided to change my career in 2023. i wanted to work in tech and build software. i started learning new technologies and building projects.
                </p>
              </div>
              <div className="timeline-middle my-1">
                <div className="bg-white text-black rounded-full pt-1 px-1">
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    style={{ width: "12px", height: "12px" }}
                    className="m-1 mt-1"
                  />
                </div>
              </div>
              <div className="timeline-end mx-2">
                2023
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-start mx-2">
                2024
              </div>
              <div className="timeline-middle my-1">
                <div className="bg-white text-black rounded-full pt-1 px-1">
                  <FontAwesomeIcon
                    icon={faFaceSmile}
                    style={{ width: "12px", height: "12px" }}
                    className="m-1 mt-1"
                  />
                </div>
              </div>
              <div className="timeline-end timeline-box max-w-xs mx-2">
                <p className="font-bold">First Job</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i got my first job as a full-stack developer in 2024. i worked on a lot of projects and learned a lot of things.
                </p>
              </div>
            </li>              
          </ul>
        </div>
      </section>
    </>
  );
};

export default Timeline;
