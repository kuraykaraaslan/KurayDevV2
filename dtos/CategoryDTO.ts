import { z } from "zod";
import CategoryMessages from "@/messages/CategoryMessages";

// Request DTOs
export const GetCategoriesRequestSchema = z.object({
    page: z.number().int().default(1),
    pageSize: z.number().int().default(10),
    search: z.string().optional(),
});

export const CreateCategoryRequestSchema = z.object({
    title: z.string().min(1, CategoryMessages.TITLE_REQUIRED),
    description: z.string().optional(),
    slug: z.string().min(1, CategoryMessages.SLUG_REQUIRED),
    image: z.string().optional(),
});

export const UpdateCategoryRequestSchema = CreateCategoryRequestSchema.extend({
    categoryId: z.string().min(1, "Category ID is required"),
});

export const GetCategoryByIdRequestSchema = z.object({
    categoryId: z.string().min(1, "Category ID is required"),
});

// Response DTOs
export const CategoryResponseSchema = z.object({
    categoryId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    image: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const CategoryListResponseSchema = z.object({
    categories: z.array(CategoryResponseSchema),
    total: z.number(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
});

// Type exports
export type GetCategoriesRequest = z.infer<typeof GetCategoriesRequestSchema>;
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;
export type GetCategoryByIdRequest = z.infer<typeof GetCategoryByIdRequestSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;
