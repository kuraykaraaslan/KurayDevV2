import { z } from "zod";

// Knowledge Graph Request/Response DTOs
export const RebuildKnowledgeGraphRequestSchema = z.object({
    // No parameters needed - server initiates rebuild
});

export const RebuildKnowledgeGraphResponseSchema = z.object({
    ok: z.boolean(),
    message: z.string(),
    error: z.string().optional(),
});

export const UpdateKnowledgeGraphRequestSchema = z.object({
    postId: z.string().min(1, "Post ID is required"),
});

export const UpdateKnowledgeGraphResponseSchema = z.object({
    ok: z.boolean(),
    message: z.string(),
    error: z.string().optional(),
});

// Type exports
export type RebuildKnowledgeGraphRequest = z.infer<typeof RebuildKnowledgeGraphRequestSchema>;
export type RebuildKnowledgeGraphResponse = z.infer<typeof RebuildKnowledgeGraphResponseSchema>;
export type UpdateKnowledgeGraphRequest = z.infer<typeof UpdateKnowledgeGraphRequestSchema>;
export type UpdateKnowledgeGraphResponse = z.infer<typeof UpdateKnowledgeGraphResponseSchema>;
