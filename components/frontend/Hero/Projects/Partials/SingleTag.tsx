import React from 'react';

import {
    faReact,
    faBootstrap,
    faHtml5,
    faPython,
    faPhp,
    faJava,
    faJs,
    faAmazon,
    faAndroid,
    faChrome,
    faOpera,
    faApple,
    faGithub,
    faGit,
    faNodeJs,
    faAws,
    faGoogle,
  } from "@fortawesome/free-brands-svg-icons";
  import {
    faAnchor,
    faAnglesDown,
    faAnglesUp,
    faCloud,
    faCode,
    faFire,
    faGear,
    faGlobe,
    faMobileScreenButton,
    faTv,
    faWind,
    IconDefinition,
  } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const SingleTag = ({ technology } : { technology: string }) => {

    const allowedTechnologies = [
        'react',
        'react native',
        'express',
        'next',
        'java',
        'python',
        'c',
        'c++',
        'c#',
        'aws',
        'azure',
        'gcp',
        'chrome extension',
        'other'
    ];

    const data: { [key: string]: { name: string, color: string, icon: IconDefinition, bgColor: string } } = {
        'react': { name: 'React', color: 'text-[#000000]', icon: faReact, bgColor: "bg-[#61DBFB]" },
        'react native': { name: 'React Native', color: 'text-[#000000]', icon: faReact, bgColor: "bg-[#61DBFB]" },
        'express': { name: 'Express', color: 'text-[#FFFFFF]', icon: faNodeJs, bgColor: "bg-[#68A063]" },
        'next': { name: 'Next.js', color: 'text-[#FFFFFF]', icon: faReact, bgColor: "bg-[#000000]" },
        'java': { name: 'Java', color: 'text-[#FFFFFF]', icon: faJava, bgColor: "bg-[#007396]" },
        'python': { name: 'Python', color: 'text-[#000000]', icon: faPython, bgColor: "bg-[#3776AB]" },
        'c': { name: 'C', color: 'text-[#FFFFFF]', icon: faCode, bgColor: "bg-[#A8B9CC]" },
        'c++': { name: 'C++', color: 'text-[#FFFFFF]', icon: faCode, bgColor: "bg-[#00599C]" },
        'c#': { name: 'C#', color: 'text-[#FFFFFF]', icon: faCode, bgColor: "bg-[#178600]" },
        'aws': { name: 'AWS', color: 'text-[#232F3E]', icon: faAws, bgColor: "bg-[#FF9900]" },
        'azure': { name: 'Azure', color: 'text-[#FFFFFF]', icon: faCloud, bgColor: "bg-[#0078D7]" },
        'gcp': { name: 'GCP', color: 'text-[#FFFFFF]', icon: faGoogle, bgColor: "bg-[#4285F4]" },
        'chrome extension': { name: 'Chrome Extension', color: 'text-[#000000]', icon: faChrome, bgColor: "bg-[#4285F4]" }
    };

    return (
        <span
            key={technology}
            className={`text-xs font-medium me-2 px-2.5 pt-0.5 pb-1 rounded flex items-center ${data[technology] ? data[technology].color : "text-base-900"} ${data[technology] ? data[technology].bgColor : "bg-[#f7f7f7]"}`}
        >
            <FontAwesomeIcon
                icon={data[technology] ? data[technology].icon : faGlobe}
                style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.25rem",
                    paddingTop: "0.25rem",
                }}
            />
            <span className="text-sm hidden lg:block">{data[technology] ? data[technology].name : technology}</span>
        </span>
    );
};

export default SingleTag;