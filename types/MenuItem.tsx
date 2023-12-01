import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export default interface MenuItem {
    id: string | null;
    page: string;
    name: string;
    icon?: IconDefinition;
    external?: boolean;

    onlyAdmin?: boolean;

    textColour?: string;
    backgroundColour?: string;
    hideTextOnDesktop?: boolean;
}
