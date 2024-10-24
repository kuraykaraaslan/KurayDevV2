import React, { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faLink } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import dynamic from "next/dynamic";
import MyImage from "./Partials/MyImage";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

const BackgroundStars = dynamic(
  () => import("./Partials/BackgroundStars"),
  { ssr: false },
);

const TypingEffect = dynamic(
  () => import("./Partials/TypingEffect"),
  { ssr: false },
);

const Welcome = () => {

  return (
    <div className="relative bg-base-200"
    style={{
      height: "100dvh",
    }}>
      <BackgroundStars />
      <div
        className="hero min-h-screen select-none"
        id="#home"
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
            <h2 className="py-6 leading-10">
              <span>I'm a self-taught full-stack developer with experience in React, Java and more. I'm open for new opportunities.</span>
            </h2>

            <Link href="/freelance" className="btn btn-primary">
              <FontAwesomeIcon
                icon={faArrowRight}
                className="mt-1"
                style={{ width: "1rem" }}
              />
              Hire Me Now
            </Link>

            <Link href="https://drive.google.com/file/d/17Ya5AC2nvcvccN-bS2pFsKFIm5v8dcWN/view?usp=drive_link" target="_blank">
              <p className="btn btn-ghost ml-2 lowercase">
                <FontAwesomeIcon
                  icon={faLink}
                  className="mt-1"
                  style={{ width: "1rem" }}
                />
                Resume
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
