"use client";
import React, {
  useState,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";

function BackgroundImage() {
  return (
    <div className="absolute top-0 left-0 z-0 w-full h-full bg-black opacity-30 xl:opacity-20">
      <Image src="/assets/img/heros/welcome4.webp" layout="fill" objectFit="cover" alt="Hero Background" />
    </div>
  );
}

export default BackgroundImage;