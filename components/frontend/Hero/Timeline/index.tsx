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
                    icon={faCode}
                    style={{ width: "12px", height: "12px" }}
                    className="m-1 mt-1"
                  />
                </div>
              </div>
              <div className="timeline-end timeline-box max-w-xs mx-2">
                <p className="font-bold">First meet with computer</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i met with computer in 2002. i was just 6 years old. i was very curious about how it works. i started to learn how to use it.
                </p>
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-start timeline-box max-w-xs mx-2">
                <p className="font-bold">University</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i started my university education in 2015. i studied structural engineering.
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
                2015
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-start mx-2">
                2021
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
                <p className="font-bold">Cadbim</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i started working at CADBIM in 2021. i worked as a structural engineer. i learned a lot about building information modeling and 3d modeling.
                </p>
              </div>
              <hr />
            </li>
            <li>
              <hr />
              <div className="timeline-start timeline-box max-w-xs mx-2">
                <p className="font-bold">Kuray Construction</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i started working at kuray construction in 2022. i worked as a civil engineer. i learned a lot about project management and teamwork.
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
                2022
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
                <p className="font-bold">Roltek Technologies</p>
                <p style={{ display: showDetails ? "block" : "none" }}>
                  i started working at roltek technologies in 2024. i work as a software engineer. i build IoT solutions and web applications.
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
