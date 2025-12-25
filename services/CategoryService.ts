import { Category } from '@/types/content';
import {prisma} from '@/libs/prisma';

export default class CategoryService {

    private static sqlInjectionRegex = /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i; // SQL injection prevention


    /**
        * Creates a new category with regex validation.
        * @param data - Category data
        * @returns The created category
        */
    static async createCategory(data: {
        title: string;
        description: string;
        slug: string;
        image: string;
    }): Promise<any> {

        let { title, description, slug, image } = data;

        // Validate input
        if (!title || !description || !slug) {
            throw new Error('All fields are required.');
        }

        // Validate input
        const existingCategory = await prisma.category.findFirst({
            where: { OR: [{ title }, { slug }] },
        });

        if (existingCategory) {
            throw new Error('Category with the same name or slug already exists.');
        }

        // Create the category
        const category = await prisma.category.create({
            data: {
                title,
                description,
                slug,
                image,
            },
        });

        return category;

    }

    /**
     * Retrieves all categories with optional pagination and search.
     * @param page - The page number
     * @param pageSize - The page size
     * @param search - The search query
     * @returns The categories and total count
     */
    static async getAllCategories(page: number, pageSize: number, search?: string): Promise<{ categories: Category[], total: number }> {

        if (search && this.sqlInjectionRegex.test(search)) {
            throw new Error('Invalid search query.');
        }

        const where = search ? {
            OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { slug: { contains: search } },
            ],
        } : {};

        const categories = await prisma.category.findMany({
            where,
            skip: (page) * pageSize,
            take: pageSize,
        });

        const total = await prisma.category.count({ where });

        return { categories, total };
    }

    /**
     * Retrieves a category by its ID.
     * @param categoryId - The ID of the category
     * @returns The requested category or null if not found
     */
    static async getCategoryById(categoryId: string): Promise<Category | null> {
        const category = await prisma.category.findUnique({
            where: { categoryId },
        });

        return category;
    }

    /**
     * Updates a category by its ID.
     * @param categoryId - The ID of the category
     * @param data - The updated category data
     * @returns The updated category
     */
    static async updateCategory(categoryId: string, data: {
        title: string;
        description: string;
        slug: string;
        image: string;
        keywords: string[];
    }): Promise<Category> {
            
            const { title, description, slug, image } = data;
    
            const category = await prisma.category.update({
                where: { categoryId },
                data: {
                    title,
                    description,
                    slug,
                    image,
                    keywords: { set: data.keywords },
                },
            });
    
            return category;
        }

    /**
     * Deletes a category by its ID.
     * @param categoryId - The ID of the category
     * @returns The deleted category
        */
    static async deleteCategory(categoryId: string): Promise<Category> {
        const category = await prisma.category.delete({
            where: { categoryId },
        });

        return category;
    }


    /**
     * Retrieves a category by its slug.
     * @param slug - The slug of the category
     * @returns The requested category or null if not found
     */
    static async getCategoryBySlug(slug: string): Promise<Category | null> {
        const category = await prisma.category.findFirst({
            where: { slug },
        });

        return category;
    }


    /**
     * Deletes all categories.
     * @returns The deleted categories
     * */
    static async deleteAllCategories(): Promise<void> {
        await prisma.category.deleteMany();

        return;
    }
}