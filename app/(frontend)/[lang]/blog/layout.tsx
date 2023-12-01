import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const layout = ({ children }: { children: React.ReactNode }) => {

  return (

    <>
      {children}
    </>
  );
};

export default layout;
