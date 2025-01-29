'use client';
import React, { useState, useEffect } from "react";

const TypingEffect = () => {

  const prefix = "I'm ready to ";
  const suffix = "";

  const texts = [
    "learn new things",
    "make a difference",
    "build the future",
    "create something amazing",
    "work together",
    "solve problems",
    "push boundaries",
    "innovate",
    "think outside the box",
    "be challenged",
    "stay humble",
    "embrace change",
    "be a team player",
    "stay focused",
    "take risks",
    "keep it simple",
    "aim high",
    "freelance",
  ];

  const [textsIndex, setTextsIndex] = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renderedText, setRenderedText] = useState("");
  const [pause, setPause] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {

        if (letterIndex >= texts[textsIndex].length) {
          setIsDeleting(true);
        }

        if (letterIndex === 0) {
          setIsDeleting(false);
          if (isDeleting) {
            setTextsIndex((textsIndex + 1) % texts.length);
          }
        }

        if (letterIndex < 0) {
          setLetterIndex(0);
        }

        if (letterIndex > texts[textsIndex].length) {
          setLetterIndex(texts[textsIndex].length);
        }

        if (isDeleting && !pause) {
          const count = -1;
          setLetterIndex(letterIndex + count);
        } else if (!pause) {
          const count = 1;
          setLetterIndex(letterIndex + count);
        }

        /*
        const count = isDeleting ? -1 : 1;
        setLetterIndex(letterIndex + count);
        */
    
    }, 50);

    setRenderedText(texts[textsIndex].substring(0, letterIndex));

    return () => clearTimeout(timeout);
  }, [letterIndex, isDeleting, pause]);

  return (
    <span className="text-3xl font-bold text-shadow-sm">
      {prefix}
      <span className="text-primary text-shadow-sm" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>{renderedText === "" ? " " : renderedText}</span>
      {suffix}
    </span>
  )
};

export default TypingEffect;
