import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXTwitter,
  faGithub,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

import Link from "next/link";

const Footer = (props: any) => {

  return (
    <>
      <footer className="footer grid grid-cols-1 lg:grid-cols-2 gap-4 bg-base-300 p-4 min-w-full shadow-lg">
        <div className="col-span-1 flex flex-row flex-wrap justify-start">
          <p>
              © {new Date().getFullYear()} Kuray Karaaslan. All rights reserved.
          </p>
        </div>
        <div className="col-span-1 flex flex-row flex-wrap justify-start">
          <Link className="link link-hover" href="/privacy">
            Privacy
          </Link>
          <Link className="link link-hover" href="/terms">
            Terms
          </Link>
          <Link className="link link-hover" href="/projects">
            Projects
          </Link>
          <Link className="link link-hover" href="/contact">
            Contact
          </Link>
        </div>
        <div className="col-span-1 flex flex-row flex-wrap justify-end">
          <Link
            href="https://twitter.com/kuraykaraaslan"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faXTwitter} style={{ width: "24px", height: "24px" }} />
          </Link>
          <Link
            href="https://github.com/kuraykaraaslan"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faGithub} style={{ width: "24px", height: "24px" }} />
          </Link>
          <Link
            href="https://www.linkedin.com/in/kuraykaraaslan/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faLinkedin} style={{ width: "24px", height: "24px" }} />
          </Link>
        </div>
      </footer>
    </>
  );
};

export default Footer;
