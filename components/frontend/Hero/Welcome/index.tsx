'use client'
import React, { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faLink } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import dynamic from "next/dynamic";
import MyImage from "./Partials/MyImageVideo";
import { Trans } from 'react-i18next';
import { useTranslation } from "react-i18next";


const TypingEffect = dynamic(
  () => import("./Partials/TypingEffect"),
  { ssr: false },
);
const BackgroundImage = dynamic(
  () => import("./Partials/BackgroundImage"),
  { ssr: false },
);

const Welcome = () => {

  const { t, i18n } = useTranslation(); // <- burada i18n de geliyor, t de geliyor

  return (
    <div className="relative bg-base-200"
      style={{
        height: "100dvh",
      }}
      id="home"
    >
      <BackgroundImage />
      <div
        className="hero min-h-screen select-none group"
        style={{
          zIndex: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div className="hero-content">
          <div className="flex-1 max-w-2xl md:mr-4">
            <h1 className="font-bold relative overflow-hidden animate-shake text-4xl leading-normal h-24 md:h-16">
              <TypingEffect />
            </h1>
            <h2 className="py-3 pb-6 leading-7 text-shadow-sm">
              <p>
                <Trans
                  i18nKey="welcome.description"
                  lang={i18n.language}
                  components={{
                    bold: <span className="font-bold" />
                  }}
                />
              </p>
            </h2>

            <Link href="#contact" className="btn btn-primary hidden lg:inline-flex">
              <FontAwesomeIcon
                icon={faArrowRight}
                className="mt-1"
                style={{ width: "1rem" }}
              />
              {t("welcome.contact_me")}
            </Link>

            <Link href="https://drive.google.com/file/d/17Ya5AC2nvcvccN-bS2pFsKFIm5v8dcWN/view?usp=drive_link" target="_blank">
              <p className="btn btn-ghost ml-2 lowercase">
                <FontAwesomeIcon
                  icon={faLink}
                  className="mt-1"
                  style={{ width: "1rem" }}
                />
                {t("welcome.resume")}
              </p>
            </Link>
          </div>

          <MyImage />
        </div>
      </div>
    </div>
  );
};

export default Welcome;
