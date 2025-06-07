'use client'
import React, { Suspense } from "react";
import "react-toastify/dist/ReactToastify.css";

const Layout = ({
    children,
}: {
    children: React.ReactNode;
}) => {

    return (
        <Suspense>
            {children}
        </Suspense>
    );
}

export default Layout;