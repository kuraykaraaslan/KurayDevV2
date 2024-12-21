import prisma from "@/libs/prisma";
import { Project } from "@prisma/client";
import { platform } from "node:os";

export default class ProjectService {

    private static sqlInjectionRegex = /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i; // SQL injection prevention
    
    static async getAllProjects(
        data: {
            page: number;
            pageSize: number;
            search?: string;
            onlyPublished?: boolean;
        }): Promise<{ projects: Project[], total: number }> {


        const { page, pageSize, search, onlyPublished } = data;


        console.log('page', page);
        console.log('pageSize', pageSize);
        console.log('search', search);
        console.log('onlyPublished', onlyPublished);

        // Validate search query
        if (search && this.sqlInjectionRegex.test(search)) {
            throw new Error('Invalid search query.');
        }

        // Get posts by search query
        const query = {
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
                projectId: true,
                title: true,
                description: true,
                slug: true,
                image: true,
                platforms: true,
                technologies: true,
            },
            where: {
                OR: [
                    {
                        title: {
                            contains: search || '',
                        },
                    },
                    {
                        description: {
                            contains: search || '',
                        },
                    }
                ],
                status: !onlyPublished ? undefined : 'PUBLISHED',
            },
        };

        console.log('query', query);

        const countQuery = {
            skip: query.skip,
            take: query.take,
            where: query.where,
        };


        const transaction = await prisma.$transaction([
            prisma.project.findMany(query),
            prisma.project.count(countQuery),
        ]);


        return { projects: transaction[0] as Project[], total: transaction[1] };

    }

    static async getProjectById(projectId: string): Promise<Project | null> {
        return prisma.project.findUnique({
            where: {
                projectId,
            },
        });
    }

    static async createProject(data: Omit<Project, 'projectId'>): Promise<Project> {
        return prisma.project.create({
            data,
        });
    }

    static async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
        return prisma.project.update({
            where: {
                projectId,
            },
            data,
        });
    }

    static async deleteProject(projectId: string): Promise<Project> {
        return prisma.project.delete({
            where: {
                projectId,
            },
        });
    }

    static async getProjectBySlug(slug: string): Promise<Project | null> {
        return prisma.project.findFirst({
            where: {
                slug,
            },
        });
    }

}
