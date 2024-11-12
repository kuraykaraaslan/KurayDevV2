import { Post, Category } from "@prisma/client";

export interface PostWithCategory extends Post {
    category: Category
}

export default PostWithCategory;