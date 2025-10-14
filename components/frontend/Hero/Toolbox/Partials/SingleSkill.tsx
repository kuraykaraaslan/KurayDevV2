import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {Skill} from "@/types/SkillTypes";

const SingleSkill: React.FC<Skill> = ({ icon, bgColor, title, textColor }) => {

  const isTextLong = title.length > 10;
  const textSize = isTextLong ? "text-sm" : "text-lg";
  
  return (
    <div className="w-28 h-20 group">
      <div
        className={`relative card w-28 h-20 from-base-100 to-base-300 bg-gradient-to-b shadow-lg relative select-none transition duration-500 transform group-hover:rotate-y-180 shadow-lg`}
      >
        <div className="flex flex-row items-center justify-center group-hover:rotate-y-180 h-full relative fixed w-28 h-20 top-0 left-0 absolute rounded-box">
          <figure className={`w-20 h-20 group-hover:hidden`}>
            <FontAwesomeIcon
              icon={icon}
              className="text-2xl flex group-hover:hidden"
            />
          </figure>
          <div className={"flex flex-col items-center justify-center hidden text-black group-hover:flex rotate-y-180 group-hover:rotate-y-0 w-28 h-20 top-0 left-0 absolute rounded-box " + (bgColor ? bgColor : "") + " " + (textColor ? textColor : "")}>
            <div className={"card-body items-center text-center duration-1000 ease-in-out transform "}>
              <h2 className={"card-title " + textSize + " " + (textColor ? textColor : "")}>

                {title}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleSkill;
