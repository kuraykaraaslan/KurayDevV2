import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export default interface Url {
    type?: "GitHub" | "Demo" | "Other";
    title?: string;
    icon?: IconDefinition;
    url: string;
};