'use client'
import React, { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faLink} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import dynamic from "next/dynamic";
import MyImage from "./Partials/MyImageVideo";


const TypingEffect = dynamic(
  () => import("./Partials/TypingEffect"),
  { ssr: false },
);
const BackgroundImage = dynamic(
  () => import("./Partials/BackgroundImage"),
  { ssr: false },
);

const Welcome = () => {

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
                <span className="font-bold">Product-focused Full-Stack Developer</span> with <span className="font-bold">2+ years of experience</span> delivering robust, scalable software solutions across <span className="font-bold">frontend, backend, mobile in BIM and IoT domains.</span> Specialized in <span className="font-bold">Java Spring Boot, React, Next.js, Node.js, and PostgreSQL</span>. Adept at architecting <span className="font-bold">multi-tenant SaaS platforms, real-time systems, and payment integrations.</span> Combines strong engineering fundamentals with <span className="font-bold">creative problem-solving</span> and a <span className="font-bold">clean, systematic coding approach.</span>
              </p>
            </h2>

            <Link href="#contact" className="btn btn-primary hidden lg:inline-flex">
              <FontAwesomeIcon
                icon={faArrowRight}
                className="mt-1"
                style={{ width: "1rem" }}
              />
              Contact Me
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
