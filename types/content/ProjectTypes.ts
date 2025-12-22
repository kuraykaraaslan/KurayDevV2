import { z } from 'zod';


const UrlSchema = z.object({
    type: z.enum(["GitHub", "Demo", "Other"]).optional(),
    title: z.string().optional(),
    icon: z.any().optional(), // IconDefinition is not directly supported by Zod
    url: z.string().url(),
});


const TagSchema = z.object({
    name: z.string(),
    color: z.string(),
    icon: z.any(), // IconDefinition is not directly supported by Zod
});



const ProjectSchema = z.object({
    projectId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    image: z.string().nullable(),
    status: z.string().default("PUBLISHED"),
    platforms: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
    content: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    projectLinks: z.array(z.string()).default([]),
});

const PlatformSchema = z.object({
    name: z.string(),
    icon: z.string(),
    url: z.string().url().optional(),
    bgColor: z.string().optional(),
    borderColor: z.string().optional(),
    zoom: z.number().optional(),
});


const ServiceSchema = z.object({
  id: z.string(),
  image: z.string(),
  title: z.string(),
  description: z.string(),
  urls: z.array(UrlSchema),
  tags: z.array(TagSchema),
  bgColor: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
});


export type Project = z.infer<typeof ProjectSchema>;
export type Platform = z.infer<typeof PlatformSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Url = z.infer<typeof UrlSchema>;

export { ProjectSchema, PlatformSchema, TagSchema, ServiceSchema, UrlSchema };