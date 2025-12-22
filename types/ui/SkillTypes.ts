import {z} from 'zod';

const SkillSchema = z.object({
  className: z.string().optional(),
  icon: z.any(), // IconProp is not directly supported by Zod
  bgColor: z.string().optional(),
  title: z.string(),
  textColor: z.string().optional(),
});

const ToolSchema = z.object({
  icon: z.any(), // IconProp is not directly supported by Zod
  title: z.string(),
  description: z.string(),
  hoverBgColor: z.string().optional(),
  hoverTextColor: z.string().optional(),
});

export type Tool = z.infer<typeof ToolSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export { SkillSchema, ToolSchema };