import {z} from 'zod';

const Skill = z.object({
  className: z.string().optional(),
  icon: z.any(), // IconProp is not directly supported by Zod
  bgColor: z.string().optional(),
  title: z.string(),
  textColor: z.string().optional(),
});

const Tool = z.object({
  icon: z.any(), // IconProp is not directly supported by Zod
  title: z.string(),
  description: z.string(),
  hoverBgColor: z.string().optional(),
  hoverTextColor: z.string().optional(),
});

export type Tool = z.infer<typeof Tool>;
export type Skill = z.infer<typeof Skill>;
export { Skill , Tool };