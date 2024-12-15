'use client';
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLightbulb,
  faSkull,
  faMoon,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useGlobalStore } from "@/libs/zustand";
import { stat } from "fs";

const ThemeButton = () => {
  const { theme, setTheme, availableThemes } = useGlobalStore();

  const themeIcons = {
    "dark": faMoon,
    "light": faLightbulb,
    "black": faSkull,
  };

  const nextTheme = () => {
    const currentIndex = availableThemes.indexOf(theme);

    var nextTheme: string;

    switch (currentIndex) {
      case -1:
        nextTheme = availableThemes[0];
        break;
      case availableThemes.length - 1:
        nextTheme = availableThemes[0];
        break;
      default:
        nextTheme = availableThemes[currentIndex + 1];
        break;
    }
    setTheme(nextTheme);
  }

  useEffect(() => {
    switch (theme) {
      case "dark":
        document.querySelector("html")?.setAttribute("data-theme", "dark");
        break;
      case "light":
        document.querySelector("html")?.setAttribute("data-theme", "light");
        break;
      case "black":
        document.querySelector("html")?.setAttribute("data-theme", "black");
        break;
      default:
        //document.querySelector("html")?.setAttribute("data-theme", "dark");
        break;
    }
  }, [theme]);

  return (
    <button
      className="btn btn-square btn-ghost rounded-full items-center justify-center grayscale duration-300 hover:grayscale-0"
      onClick={nextTheme}

    >
      <FontAwesomeIcon
        icon={themeIcons[theme as keyof typeof themeIcons] ? themeIcons[theme as keyof typeof themeIcons] : faMoon}
        style={{ width: "24px", height: "24px" }}
      />
    </button>
  );
};

export default ThemeButton;
