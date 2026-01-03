'use client'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faLink } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import dynamic from "next/dynamic";
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

const MyImage = dynamic(
  () => import("./Partials/MyImageVideo"),
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
      <div
        className="hero min-h-screen select-none group"
        style={{
          zIndex: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          
backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 1600 800'%3E%3Cg fill-opacity='0.39'%3E%3Cpolygon fill='%23222222' points='800 100 0 200 0 800 1600 800 1600 200'/%3E%3Cpolygon fill='%23444444' points='800 200 0 400 0 800 1600 800 1600 400'/%3E%3Cpolygon fill='%23666666' points='800 300 0 600 0 800 1600 800 1600 600'/%3E%3Cpolygon fill='%23888888' points='1600 800 800 400 0 800'/%3E%3Cpolygon fill='%23aaaaaa' points='1280 800 800 500 320 800'/%3E%3Cpolygon fill='%23cccccc' points='533.3 800 1066.7 800 800 600'/%3E%3Cpolygon fill='%23EEE' points='684.1 800 914.3 800 800 700'/%3E%3C/g%3E%3C/svg%3E\")",
backgroundAttachment: "fixed",
backgroundSize: "cover",
        }}
      >
        <div className="hero-content">
          <div className="flex-1 max-w-2xl md:mr-4">
            <h1 className="font-bold relative overflow-hidden animate-shake text-5xl leading-normal h-24 md:h-16">
              <TypingEffect />
            </h1>
            <h2 className="py-3 pb-6 leading-7 text-lg">
              <p>
                <Trans
                  i18nKey="pages.welcome.description"
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
              {t("pages.welcome.contact_me")}
            </Link>

            <Link href="https://drive.google.com/file/d/17Ya5AC2nvcvccN-bS2pFsKFIm5v8dcWN/view?usp=drive_link" target="_blank">
              <p className="btn btn-ghost ml-2 lowercase hidden">
                <FontAwesomeIcon
                  icon={faLink}
                  className="mt-1"
                  style={{ width: "1rem" }}
                />
                {t("pages.welcome.resume")}
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
