

import { NextResponse } from "next/server";
import { Project } from "@/generated/prisma";
import ProjectService from "@/services/ProjectService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import { CreateProjectRequestSchema, UpdateProjectRequestSchema } from "@/dtos/ProjectDTO";
import ProjectMessages from "@/messages/ProjectMessages";

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

        const result = await ProjectService.getAllProjects({
            page,
            pageSize,
            search,
            projectId
        });
        
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

        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

        const data = await request.json();
        
        const parsedData = CreateProjectRequestSchema.safeParse(data);
        
        if (!parsedData.success) {
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }
        
        const project = await ProjectService.createProject(parsedData.data) as Project;
        
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

        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

        const data = await request.json();
        
        const parsedData = UpdateProjectRequestSchema.safeParse(data);
        
        if (!parsedData.success) {
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }
        
        const project = await ProjectService.updateProject(parsedData.data as Project);
        
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
