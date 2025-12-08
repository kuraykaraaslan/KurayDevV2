'use client';
import { useEffect, useState, ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useGlobalStore from "@/libs/zustand";
import { toast } from "react-toastify";
import i18n from "@/libs/localize/localize";


const Layout = ({ children }: { children: ReactNode }) => {

  const { language } = useGlobalStore();
  const [ languageNotifiedOnce, setLanguageNotifiedOnce ] = useState(false);
  const { t } = i18n;

  useEffect(() => {

    if (languageNotifiedOnce) return;

    console.log("language", language);
    //if language is not en , notify that blog is only in english
    if (language !== "en") {
      toast.info(t("alert.this_blog_is_available_in_only_english"));
      setLanguageNotifiedOnce(true);
      //setLanguage("en");
    }
  }, [language]);


  return (

    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light" 
      />
    </>
  );
};

export default Layout;
