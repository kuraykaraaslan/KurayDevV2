import React, { useState, useEffect } from "react";
import { CircleFlag } from "react-circle-flags";
import useGlobalStore from "@/libs/zustand";


const LangButton = () => {

  const { language, setLanguage, availableLanguages } = useGlobalStore();

  const languageFlags = {
    "en": "us",
    "tr": "tr",
    "de": "de",
    "gr": "gr",
  };
   

  const nextLanguage = () => {
    const currentIndex = availableLanguages.indexOf(language);

    var nextLanguage : string;

    switch (currentIndex) {
      case -1:
        nextLanguage = availableLanguages[0];
        break;
      case availableLanguages.length - 1:
        nextLanguage = availableLanguages[0];
        break;
      default:
        nextLanguage = availableLanguages[currentIndex + 1];
        break;
    }
    setLanguage(nextLanguage);
  };


  return (
    <button
      className="btn btn-square btn-ghost rounded-full items-center justify-center grayscale duration-300 hover:grayscale-0"
      onClick={nextLanguage}
    >
      <CircleFlag
        height="24"
        width="24"
        countryCode={languageFlags[language as keyof typeof languageFlags] ? languageFlags[language as keyof typeof languageFlags] : "us"}
      />
    </button>
  );
};

export default LangButton;
