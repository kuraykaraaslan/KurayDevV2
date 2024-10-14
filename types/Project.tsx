import Tag from './Tag';
import Url from './Url';

export default interface Project {
    id: string;
    image?: string;
    imageHtml?: string;
    title: string;
    description: string;
    urls: Url[];
    tags: Tag[];
    bgColor?: string;
    borderColor?: string;
    textColor?: string;
};