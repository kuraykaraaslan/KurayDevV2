import { Post, Category } from "@prisma/client";

export interface PostWithCategory extends Post {
    category: Pick<Category, "categoryId" | "title" | "slug" | "image" | "keywords" | "description" | "createdAt" | "updatedAt">;
}

export default PostWithCategory;