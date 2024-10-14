'use client';
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLightbulb,
  faSkull,
  faMoon,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";


const ThemeButton = () => {
  const [currentTheme, setCurrentTheme] = useState("dark");

  const themesWithIcons = {
    dark: faMoon,
    light: faLightbulb,
    black: faSkull,
  } as { [key: string]: IconDefinition };

  useEffect(() => {
    // Check for theme in local storage
    const localTheme = localStorage.getItem("theme");

    if (localTheme) {
      setCurrentTheme(localTheme);
      const html = document.querySelector("html");
      if (html) {
        html.setAttribute("data-theme", localTheme);
      }
      return;
    } else {
      // Default theme
      setCurrentTheme("dark");
      localStorage.setItem("theme", "dark");
    }
  }, []);

  const changeTheme = (direction: number) => {
    const themes = Object.keys(themesWithIcons);
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex =
      (currentIndex + direction + themes.length) % themes.length;
    const nextTheme = themes[nextIndex];

    localStorage.setItem("theme", nextTheme);

    setCurrentTheme(nextTheme);

    const html = document.querySelector("html");
    if (html) {
      html.setAttribute("data-theme", nextTheme);
    }
  };

  const changeThemeEachOther = (event: any) => {
    event.preventDefault();
    //if left click
    if (event.button === 0) {
      changeTheme(1);
    } else {
      changeTheme(-1);
    }
  };

  return (
    <button
      className="btn btn-square btn-ghost rounded-full items-center justify-center grayscale duration-300 hover:grayscale-0"
      onClick={changeThemeEachOther}
      onContextMenu={changeThemeEachOther}
    >
      <FontAwesomeIcon
        icon={themesWithIcons[currentTheme] as IconDefinition}
        style={{ width: "24px", height: "24px" }}
      />
    </button>
  );
};

export default ThemeButton;
