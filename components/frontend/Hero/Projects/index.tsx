'use client';
import React, { useState } from 'react';
import {
  faAnglesDown,
  faAnglesUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import SingleProject from './Partials/SingleProject'
import { Project } from '@prisma/client';
import axiosInstance from '@/libs/axios';

const ProjectsHero = () => {

  const allowedFilters = [
    'ui/ux',
    'web',
    'mobile',
    'desktop',
    'embedded',
    'other',
    'iot',
    'gaming',
    'machine learning'
  ];

  const { t } = useTranslation()
  const [filter, setFilter] = useState("");

  const [expanded, setExpanded] = React.useState(false);
  const container = React.useRef(null);

  const [search, _setSearch] = React.useState('');
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [page, _setPage] = React.useState(0);
  const [pageSize, _setPageSize] = React.useState(100);
  const [_total, setTotal] = React.useState(0);

  React.useEffect(() => {

    axiosInstance.get("/api/projects" + `?page=${page + 1}&pageSize=${pageSize}&search=${search}&sort=desc&onlyPublished=true`)
      .then((response) => {
        setProjects(response.data.projects);
        setTotal(response.data.total);
      })
      .catch((error) => {
        console.error(error);
      });
  }
    , [page, pageSize, search]);


  const continueOnGitHub: Project = {
    projectId: '',
    title: 'Other Projects',
    description: 'For other projects, check my GitHub profile. You can find various projects that I have worked on.',
    slug: 'not-slug',
    image: "/assets/img/projects/github-wallpaper-scaled.webp",
    status: '',
    platforms: [],
    technologies: [],
    content: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    projectLinks: [
      'https://github.com/kuraykaraaslan/'
    ]
  }

  const filteredProjects = projects.filter((project) => {
    if (filter === "") {
      return true;
    }
    return project.platforms.includes(filter);
  });


  const handleClick = () => {
    // get container current height
    const panel = container?.current as unknown as HTMLElement;

    if (panel === null) return;

    //make height is auto
    panel.style.height = expanded ? "560px" : `${panel.scrollHeight + 80}px`;

    //toggle the state
    setExpanded(!expanded);
  };


  return (
    <>
      <section className="bg-base-200 pt-16" id="portfolio">
        <div
          className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000"
          style={{ height: "560px", overflow: "clip" }}
          ref={container}
        >
          <div className="mx-auto max-w-screen-sm text-center lg:mb-8 -mt-8 lg:mt-0 ">
            <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold">
              {t("projects.title")}
            </h2>
            <p className="font-light sm:text-xl">
              {t("projects.description")}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8 mt-3">
            <button
              className={`btn btn-primary ${filter === "" ? "btn-active" : ""}`}
              onClick={() => setFilter("")}
            >
              all
            </button>
            {allowedFilters.map((tag, index) => (
              <button
                key={index}
                className={`btn btn-primary ${filter === tag ? "btn-active" : ""}`}
                onClick={() => setFilter(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-3 mt-8">
            {filteredProjects.map((project: Project, index: number) => (
              <SingleProject key={index}
                project={project} />
            ))}
            <SingleProject key={filteredProjects.length}
              project={continueOnGitHub} />
          </div>

        </div>

        <div
          className="flex carousel-indicators gap-2 bg-transparent select-none"
          style={{
            zIndex: 8,
            position: "relative",
            left: "0",
            right: "0",
            margin: "auto",
            height: "0px",
            width: "100%",
            bottom: "20",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            className="flex carousel-indicators gap-2 bg-gradient-to-b from-base-200/20 to-base-300"
            style={{
              zIndex: 8,
              position: "relative",
              left: "0",
              right: "0",
              margin: "auto",
              height: "80px",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              transform: "translateY(-80px)",
            }}
          >
            {!expanded ? (
              <button
                className="flex flex-col items-center gap-2 animate-bounce"
                style={{ height: "80px", width: "130px" }}
                onClick={handleClick}
              >
                <FontAwesomeIcon
                  icon={faAnglesDown}
                  style={{
                    width: "2.0rem",
                    height: "2.0rem",
                  }}
                />{" "}
                <span>{expanded ? "Show Less" : "Show More"}</span>
              </button>
            ) : (
              <button
                className="flex flex-col items-center gap-2"
                style={{ height: "80px", width: "130px" }}
                onClick={handleClick}
              >
                <FontAwesomeIcon
                  icon={faAnglesUp}
                  style={{ width: "2.0rem", height: "2.0rem" }}
                />{" "}
                <span>{expanded ? "Show Less" : "Show More"}</span>
              </button>
            )}
          </div>
        </div>
        
      </section>
    </>
  );
};


export default ProjectsHero;