import { z } from 'zod';


const Url = z.object({
    type: z.enum(["GitHub", "Demo", "Other"]).optional(),
    title: z.string().optional(),
    icon: z.any().optional(), // IconDefinition is not directly supported by Zod
    url: z.string().url(),
});


const Tag = z.object({
    name: z.string(),
    color: z.string(),
    icon: z.any(), // IconDefinition is not directly supported by Zod
});



const Project = z.object({
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

const Platform = z.object({
    name: z.string(),
    icon: z.string(),
    url: z.string().url().optional(),
    bgColor: z.string().optional(),
    borderColor: z.string().optional(),
    zoom: z.number().optional(),
});


const Service = z.object({
  id: z.string(),
  image: z.string(),
  title: z.string(),
  description: z.string(),
  urls: z.array(Url),
  tags: z.array(Tag),
  bgColor: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
});


export type Project = z.infer<typeof Project>;
export type Platform = z.infer<typeof Platform>;
export type Tag = z.infer<typeof Tag>;
export type Service = z.infer<typeof Service>;
export type Url = z.infer<typeof Url>;

export { Project, Platform, Tag, Service, Url };