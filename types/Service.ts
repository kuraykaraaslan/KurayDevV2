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