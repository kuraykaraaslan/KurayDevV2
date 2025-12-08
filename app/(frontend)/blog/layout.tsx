'use client';
import { useEffect, useState, ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useGlobalStore from "@/libs/zustand";
import { toast } from "react-toastify";
import i18n from "@/libs/localize/localize";
import Head from "next/head"; 


const Layout = ({ children }: { children: ReactNode }) => {
  const { language } = useGlobalStore();
  const [languageNotifiedOnce, setLanguageNotifiedOnce] = useState(false);
  const { t } = i18n;

  useEffect(() => {
    if (languageNotifiedOnce) return;

    if (language !== "en") {
      toast.info(t("alert.this_blog_is_available_in_only_english"));
      setLanguageNotifiedOnce(true);
    }
  }, [language]);


  return (
    <>
      <Head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Kuray Karaaslan — RSS Feed"
          href="https://kuray.dev/feed.xml"
        />
      </Head>

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
