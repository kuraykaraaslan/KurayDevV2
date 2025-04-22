import { IconProp } from "@fortawesome/fontawesome-svg-core";
import React from "react";
export default interface Tool {
    icon: IconProp ;
    title: string;
    description: string;
    hoverBgColor?: string;
    hoverTextColor?: string;
  };