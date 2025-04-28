'use client';
import React from 'react';
import {
  faAnglesDown,
  faAnglesUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import TimelineItems from './Partials/TimelineItems';
import BackgroundImage from './Partials/BackgroundImage';
import { useTranslation } from 'react-i18next';

const Timeline = () => {

  const [expanded, setExpanded] = React.useState(false);
  const container = React.useRef(null);

  const { t } = useTranslation();


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
      <section className="relative bg-base-100 pt-16" id="timeline">
        <BackgroundImage />
        <div
          className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000"
          style={{ height: "560px", overflow: "clip" }}
          ref={container}
        >
          <div className="mx-auto max-w-screen-sm text-center lg:mb-8 -mt-8 lg:mt-0 ">
            <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold">
              {t("timeline.title")}
            </h2>
            <p className="font-light sm:text-xl">
              {t("timeline.description")}
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-1">
            <TimelineItems />

          </div>

        </div>
        <div
          className="flex carousel-indicators gap-2 bg-transparent select-none"
          style={{
            zIndex: 8,
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
              zIndex: 8,
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

export default Timeline;
