import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { z } from 'zod';

const MenuItem = z.object({
    id: z.string().nullable(),
    page: z.string(),
    name: z.string(),
    icon: z.any().optional(), // IconDefinition is not directly supported by Zod
    external: z.boolean().default(false),
    onlyAdmin: z.boolean().default(false),
    textColour: z.string().optional(),
    backgroundColour: z.string().optional(),
    hideTextOnDesktop: z.boolean().default(false),
});

export type MenuItem = z.infer<typeof MenuItem>;
export { MenuItem };
