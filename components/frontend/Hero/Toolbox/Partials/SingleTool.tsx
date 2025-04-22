import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import Tool from "@/types/Tool";


const SingleTool: React.FC<Tool> = ({
  icon,
  title,
  description,
  hoverBgColor,
  hoverTextColor,
}) => {
  return (
    <div className="w-40 h-40 group">
      <div
        className={"relative card w-40 h-40 from-base-100 to-base-300 bg-gradient-to-b shadow-lg relative select-none transition duration-500 transform group-hover:rotate-y-180 px-2 py-2 shadow-lg "}
      >
        <div className="flex flex-col items-center justify-center group-hover:hidden">
          <figure className="px-10 pt-5 -mb-3">
            <FontAwesomeIcon icon={icon} className="text-8xl" />
          </figure>
        </div>
        <div className={"flex flex-col items-center justify-center hidden group-hover:flex rotate-y-180 w-40 h-40 top-0 left-0 absolute rounded-box " + (hoverBgColor ? hoverBgColor : "") + " " + (hoverTextColor ? hoverTextColor : "")}> 
          <figure className="px-10 pt-5 -mb-4">
            <FontAwesomeIcon
              icon={icon}
              className="text-4xl transition duration-500 hover:animate-spin"
            />
          </figure>
          <div className={"card-body items-center text-center duration-1000 ease-in-out "}>
            <h2 className="card-title">{title}</h2>
            <span className="text-xs">{description}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleTool;
