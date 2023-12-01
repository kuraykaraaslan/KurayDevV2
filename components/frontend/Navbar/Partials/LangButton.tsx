'use client';
import React, { useState, useEffect } from "react";
import { CircleFlag } from "react-circle-flags";
import { useParams, useRouter, usePathname } from "next/navigation";


interface Language {
  code: string;
  flag: string;
}

const LangButton = () => {

  const { lang } = useParams();
  const router = useRouter();

  const [currentLanguage, setCurrentLanguage] = useState(lang || "en");

  const languagesWithFlags: Language[] = [
    { code: "en", flag: "gb" },
    { code: "tr", flag: "tr" },
    { code: "de", flag: "de" },
    { code: "gr", flag: "gr" },
    { code: "th", flag: "th" },
  ];

  const modalRef = React.createRef<HTMLDialogElement>();

  const openModal = () => {
    if (modalRef.current) {
      modalRef.current?.showModal();
    }
  }

  const changeLanguage = (language: string) => {
    setCurrentLanguage(language);
    router.push(`/${language}`);
  }

  return (
    <>
      <dialog id="lang_modal" className="modal" ref={modalRef}>
        <div className="modal-box">
          <div className="flex flex-wrap">
            <label
              className="p-2 text-lg rounded-full items-center justify-center flex-1"
            >
              Select Language:
            </label>

            {languagesWithFlags.map((language: Language) => (
              <button
                className="btn btn-square btn-ghost rounded-full items-center justify-center duration-300"
                key={language.code}
                onClick={() => changeLanguage(language.code)}
              >
                <CircleFlag
                  height="24"
                  width="24"
                  countryCode={language.flag}
                />
              </button>
            ))}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>


      <button
        className="btn btn-square btn-ghost rounded-full items-center justify-center grayscale duration-300 hover:grayscale-0"
        onClick={openModal}
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

    </>
  );
};

export default LangButton;
