import { ReactNode } from "react";
import { Metadata } from "next";
import BlogLayoutClient from "./layout.client";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/rss+xml": "https://kuray.dev/feed.xml",
    },
  },
};

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <BlogLayoutClient />
    </>
  );
};

export default Layout;
