'use client';
import React, { useState, useEffect } from "react";
import { CircleFlag } from "react-circle-flags";

interface Language {
  code: string;
  flag: string;
}

const LangButton = () => {
  const [currentLanguage, setCurrentLanguage] = useState("en");

  const languagesWithFlags: Language[] = [
    { code: "en", flag: "gb" },
    { code: "tr", flag: "tr" },
    { code: "de", flag: "de" },
    { code: "th", flag: "th" },
    { code: "gr", flag: "gr" }
  ];

  const changeLanguage = (direction: number) => {
    const currentIndex = languagesWithFlags.findIndex(
      (x: Language) => x.code === currentLanguage
    );

    let newIndex = currentIndex + direction;
    if (newIndex < 0) {
      newIndex = languagesWithFlags.length - 1;
    } else if (newIndex >= languagesWithFlags.length) {
      newIndex = 0;
    }

    setCurrentLanguage(languagesWithFlags[newIndex].code);
  };

  const changeLanguageEachOther = (event: any) => {
    event.preventDefault();
    //if left click
    if (event.button === 0) {
      changeLanguage(1);
    } else {
      changeLanguage(0);
    }
  };

  return (
    <button
      className="btn btn-square btn-ghost rounded-full items-center justify-center grayscale duration-300 hover:grayscale-0"
      onClick={changeLanguageEachOther}
      onContextMenu={changeLanguageEachOther}
    >
      <CircleFlag
        height="24"
        width="24"
        countryCode={
          languagesWithFlags.find((x: Language) => x.code === currentLanguage)
            ?.flag as string
        }
      />
    </button>
  );
};

export default LangButton;
