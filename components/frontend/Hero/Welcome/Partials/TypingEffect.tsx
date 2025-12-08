'use client';
import i18n from "@/libs/localize/localize";
import { useState, useEffect, useMemo } from "react";

const TypingEffect = () => {
  const { t } = i18n;

  const texts = useMemo(
    () => [
      t("welcome.typingEffect.text1"),
      t("welcome.typingEffect.text2"),
      t("welcome.typingEffect.text3"),
      t("welcome.typingEffect.text4"),
      t("welcome.typingEffect.text5"),
      t("welcome.typingEffect.text6"),
    ],
    [i18n.language]
  );

  const [textsIndex, setTextsIndex] = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pause, setPause] = useState(false);
  const [renderedText, setRenderedText] = useState("");

  useEffect(() => {
    const current = texts[textsIndex];
    const delay = isDeleting ? 30 : 80;
    const pauseAfterFull = 1000;
    const pauseAfterDelete = 300;

    const handleTyping = () => {
      if (pause) return;
      if (!isDeleting && letterIndex < current.length) {
        setLetterIndex((i) => i + 1);
      } else if (isDeleting && letterIndex > 0) {
        setLetterIndex((i) => i - 1);
      } else if (!isDeleting && letterIndex === current.length) {
        setTimeout(() => setIsDeleting(true), pauseAfterFull);
      } else if (isDeleting && letterIndex === 0) {
        setIsDeleting(false);
        setTextsIndex((i) => (i + 1) % texts.length);
        setTimeout(() => {}, pauseAfterDelete);
      }
    };

    const timeout = setTimeout(handleTyping, delay);
    setRenderedText(current.substring(0, letterIndex));
    return () => clearTimeout(timeout);
  }, [letterIndex, isDeleting, pause, textsIndex, texts]);

  return (
    <span className="text-3xl font-bold text-shadow-sm pb-2">
      {t("welcome.typingEffect.prefix")}&nbsp;
      <span className="text-primary text-shadow-sm" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>{renderedText === "" ? " " : renderedText}</span>
      &nbsp;
      {t("welcome.typingEffect.suffix")}
    </span>
  )
};

export default TypingEffect;
