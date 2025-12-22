import { NextResponse } from "next/server";
import { SearchResultItemType, SearchType } from '@/types/content';
import PostService from "@/services/PostService";
import ProjectService from "@/services/ProjectService";
import { PostWithData } from '@/types/content';
import { Project } from '@/types/content';
import { SearchRequestSchema } from "@/dtos/AIAndServicesDTO";
import AIMessages from "@/messages/AIMessages";

export const revalidate = 60; // 1 dakika cache

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase();
    
    const parsedData = SearchRequestSchema.safeParse({ query: q });
    
    if (!parsedData.success) {
        return NextResponse.json({
            message: parsedData.error.errors.map(err => err.message).join(", ")
        }, { status: 400 });
    }

    const blogResults = PostService.getAllPosts({ page: 0, pageSize: 4, search: q }).then(res => {
        return res.posts;
    });

    const projectResults = ProjectService.getAllProjects({ page: 0, pageSize: 2, search: q }).then(res => {
        return res.projects;
    });

    const [blogData, projectData] = await Promise.all([blogResults, projectResults]) as [PostWithData[], Project[]];    

    const blogResultsFormatted : SearchResultItemType[] = blogData.map(post => ({
        title: post.title,
        description: post.description || null,
        path: `/blog/${post.category.slug}/${post.slug}`,
        type: SearchType.BLOG,
        createdAt: post.createdAt,
    }));

    const projectResultsFormatted : SearchResultItemType[] = projectData.map(project => ({
        title: project.title,
        description: project.description || null,
        path: `/projects/${project.slug}`,
        type: SearchType.PROJECT,
        createdAt: project.createdAt ? project.createdAt : new Date(),
    })).slice(0, 0); // Projeleri arama sonuçlarına dahil etme


    let results = [...projectResultsFormatted, ...blogResultsFormatted].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ hits: results });
}
