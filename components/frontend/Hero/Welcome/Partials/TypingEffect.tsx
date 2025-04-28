'use client';
import i18n from "@/libs/localize/localize";
import React, { useState, useEffect } from "react";

const TypingEffect = () => {

  const { t } = i18n;

  const texts = [
    t("welcome.typingEffect.text1"),
    t("welcome.typingEffect.text2"),
    t("welcome.typingEffect.text3"),
    t("welcome.typingEffect.text4"),
    t("welcome.typingEffect.text5"),
    t("welcome.typingEffect.text6")
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
      {t("welcome.typingEffect.prefix")}&nbsp;
      <span className="text-primary text-shadow-sm" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>{renderedText === "" ? " " : renderedText}</span>
      &nbsp;
      {t("welcome.typingEffect.suffix")}
    </span>
  )
};

export default TypingEffect;
