import { ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head"; 


const Layout = ({ children }: { children: ReactNode }) => {

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
