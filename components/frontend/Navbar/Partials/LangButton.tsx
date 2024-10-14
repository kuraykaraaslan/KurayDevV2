'use client';
import React, { useState, useEffect } from "react";
import { CircleFlag } from "react-circle-flags";
import i18n from "@/libs/i18n";

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
  ];

  useEffect(() => {
    const localLanguage = localStorage.getItem("language");

    if (localLanguage) {
      setCurrentLanguage(localLanguage);
      i18n.changeLanguage(localLanguage);
    } else {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage]); // Add currentLanguage as a dependency

  const changeLanguage = (direction: number) => {
    const nextLanguageIndex =
      (languagesWithFlags.findIndex(
        (x: Language) => x.code === currentLanguage,
      ) +
        direction +
        languagesWithFlags.length) %
      languagesWithFlags.length;
    const nextLanguage = languagesWithFlags[nextLanguageIndex];

    localStorage.setItem("language", nextLanguage.code);
    setCurrentLanguage(nextLanguage.code);
    i18n.changeLanguage(nextLanguage.code);
    console.log("lang changed to " + nextLanguage.code);

    const html = document.querySelector("html");
    if (html) {
      html.setAttribute("lang", nextLanguage.code);
    }
  };

  const changeLanguageEachOther = (event: any) => {
    event.preventDefault();
    //if left click
    if (event.button === 0) {
      changeLanguage(1);
    } else {
      changeLanguage(-1);
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
