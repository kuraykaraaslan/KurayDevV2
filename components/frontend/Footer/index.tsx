'use client';
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXTwitter,
  faGithub,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import SystemStatusButton from "../SystemStatusButton";
import GeoHeatmapButton from "../GeoHeatmap/Button";

const Footer = () => {

  const { t } = useTranslation();

  return (
    <>
      <footer className="footer grid grid-cols-1 lg:grid-cols-2 gap-4 bg-base-300 p-4 min-w-full shadow-lg">
        <div className="col-span-1 flex flex-row flex-wrap justify-start">
          <p>
              © {new Date().getFullYear()} Kuray Karaaslan. {t("footer.all_rights_reserved")}
          </p>
          <SystemStatusButton />
          <GeoHeatmapButton />
        </div>
        <div className="col-span-1 flex flex-row flex-wrap justify-start">

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
