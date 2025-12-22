import { z } from "zod";
import ProjectMessages from "@/messages/ProjectMessages";

// Request DTOs
export const GetProjectsRequestSchema = z.object({
    page: z.number().int().default(1),
    pageSize: z.number().int().default(10),
    search: z.string().optional(),
    projectId: z.string().optional(),
});

export const CreateProjectRequestSchema = z.object({
    title: z.string().min(1, ProjectMessages.TITLE_REQUIRED),
    description: z.string().optional(),
    slug: z.string().min(1, ProjectMessages.SLUG_REQUIRED),
    image: z.string().optional(),
    content: z.string().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).default('DRAFT'),
    tags: z.array(z.string()).optional(),
    links: z.array(z.object({
        label: z.string(),
        url: z.string().url(ProjectMessages.INVALID_LINK_URL),
    })).optional(),
    technologies: z.array(z.string()).optional(),
});

export const UpdateProjectRequestSchema = CreateProjectRequestSchema.extend({
    projectId: z.string().min(1, "Project ID is required"),
});

export const GetProjectByIdRequestSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
});

// Response DTOs
export const ProjectResponseSchema = z.object({
    projectId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    image: z.string().nullable(),
    content: z.string().nullable(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
    tags: z.array(z.string()).optional(),
    links: z.array(z.object({
        label: z.string(),
        url: z.string(),
    })).optional(),
    technologies: z.array(z.string()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const ProjectListResponseSchema = z.object({
    projects: z.array(ProjectResponseSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
});

// Type exports
export type GetProjectsRequest = z.infer<typeof GetProjectsRequestSchema>;
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;
export type GetProjectByIdRequest = z.infer<typeof GetProjectByIdRequestSchema>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;
