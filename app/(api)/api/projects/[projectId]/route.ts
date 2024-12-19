"use server";
import { NextResponse } from "next/server";
import NextRequest from "@/types/NextRequest";
import ProjectService from "@/services/ProjectService";
import AuthService from "@/services/AuthService";

/**
 * GET handler for retrieving a project by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including projectId
 * @returns A NextResponse containing the project data or an error message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const project = await ProjectService.getProjectById(projectId);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });

  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a project by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including projectId
 * @returns A NextResponse containing a success message or an error message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {

    AuthService.authenticateSync(request, "ADMIN");

    const { projectId } = params;
    const project = await ProjectService.getProjectById(projectId);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    await ProjectService.deleteProject(project.projectId);

    return NextResponse.json(
      { message: "Project deleted successfully." }
    );
  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a project by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including projectId
 * @returns A NextResponse containing the updated project data or an error message
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {

    AuthService.authenticateSync(request, "ADMIN");
    
    const { projectId } = params;
    const project = await ProjectService.getProjectById(projectId);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    const data = await request.json();
    const updatedProject = await ProjectService.updateProject(project.projectId, data);

    return NextResponse.json({ project: updatedProject });
  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}