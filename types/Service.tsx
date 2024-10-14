// SingleProject.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

import Link from "next/link";
import Tag from "@/types/Tag";
import Url from "@/types/Url";

export default interface Service {
  id: string;
  image: string;
  title: string;
  description: string;
  urls: Url[];
  tags: Tag[];
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
};