"use server";

import { NextResponse } from "next/server";
import NextRequest from "@/types/NextRequest";
import { Project } from "@prisma/client";
import ProjectService from "@/services/ProjectService";
import AuthService from "@/services/AuthService";

/**
 * GET handler for retrieving all projects with optional pagination and search.
 * @param request - The incoming request object
 * @returns A NextResponse containing the projects data or an error message
 * */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const search = searchParams.get('search') || undefined;
        const projectId = searchParams.get('projectId') || undefined;

        

        const data = {
            page,
            pageSize,
            search,
            projectId
        }

        const result = await ProjectService.getAllProjects(data);
        return NextResponse.json({ projects: result.projects, total: result.total , page, pageSize });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST handler for creating a new project.
 * @param request - The incoming request object
 * @returns A NextResponse containing the newly created project or an error message
 * */
export async function POST(request: NextRequest) {
    try {

        AuthService.authenticateSync(request, "ADMIN");

        const data = await request.json() as Omit<Project, 'projectId'>;
        const project = await ProjectService.createProject(data) as Project;
        
        return NextResponse.json({ project });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }

}


/**
 * PUT handler for updating an existing project.
 * @param request - The incoming request object
 * @returns A NextResponse containing the updated project data or an error message
 * */
export async function PUT(request: NextRequest) {
    try {

        AuthService.authenticateSync(request, "ADMIN");

        const data = await request.json() as Project;
        const project = await ProjectService.updateProject(data);
        
        return NextResponse.json({ project });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }

}
