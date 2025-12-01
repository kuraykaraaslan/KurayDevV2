import { z } from "zod";

export enum SearchType {
    BLOG = "BLOG",
    PROJECT = "PROJECT",
}

export const SearchResultItem = z.object({
    title: z.string(),
    description: z.string().nullable().optional(),
    path: z.string(),
    type: z.enum([SearchType.BLOG, SearchType.PROJECT]),
    createdAt: z.date(),
});


export enum SearchTypeColors {
    BLOG = "bg-blue-100 text-blue-800 border-blue-200",
    PROJECT = "bg-green-100 text-green-800 border-green-200",
}
export type SearchResultItemType = z.infer<typeof SearchResultItem>;