// SinglePortfolio.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";

import Portfolio from "@/types/Portfolio";
import Tag from "@/types/Tag";
import Url from "@/types/Url";
import Image from 'next/image';


const SinglePortfolio: React.FC<{ portfolio: Portfolio }> = ({ portfolio }) => {
  return (
    <article
      className={`rounded-lg border shadow-md ${portfolio.bgColor ? portfolio.bgColor : "bg-base-300"} ${portfolio.borderColor ? portfolio.borderColor : "border-base-200"} ${portfolio.textColor ? portfolio.textColor : "text-base-900"}`}
    >
      <div className="shadow-md rounded-t-lg">
        {portfolio.imageHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: portfolio.imageHtml }}
            className="w-full h-48 object-cover object-center rounded-t-lg"
          />
        ) : portfolio.image ? (
        <Image
          width="0"
          height="0"
          unoptimized={true}
          src={portfolio.image}
          alt={portfolio.title}
          className="w-full h-48 object-cover object-center rounded-t-lg"
        /> ) : (
          <div className="w-full h-48 bg-base-100 rounded-t-lg"></div>
        )}
      </div>
      <div className="pt-6 px-6 flex items-center mb-5 text-black">
        {portfolio.tags.map((tag) => (
          <span
            key={tag.name}
            className={`text-xs font-medium me-2 px-2.5 pt-0.5 pb-1 rounded flex items-center ${tag.color}`}
          >
            <FontAwesomeIcon
              icon={tag.icon}
              style={{
                width: "1rem",
                height: "1rem",
                marginRight: "0.25rem",
                paddingTop: "0.25rem",
              }}
            />
            <span className="text-sm hidden lg:block">{tag.name}</span>
          </span>
        ))}
      </div>
      <h2 className="px-6 mb-2 text-2xl font-bold tracking-tight">
        <Link href="">{portfolio.title}</Link>
      </h2>
      <p className="px-6 mb-5 font-light">{portfolio.description}</p>
      <div className="px-6 pb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {portfolio.urls && portfolio.urls.map((url: Url) => (
            <Link
              key={url.url}
              href={url.url}
              className="inline-flex items-center font-medium hover:underline"
            >
              <FontAwesomeIcon
                icon={
                  url.icon
                    ? url.icon
                    : url.url.startsWith("https://github.com")
                      ? faGithub
                      : faGlobe
                }
                style={{
                  width: "1rem",
                  height: "1rem",
                  marginRight: "0.25rem",
                  paddingTop: "0.25rem",
                }}
              />
              {url.title
                ? url.title
                : url.type === "GitHub"
                  ? "GitHub"
                  : "Demo"}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
};

export default SinglePortfolio;
