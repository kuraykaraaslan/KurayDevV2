import { NextResponse } from "next/server";
import ProjectService from "@/services/ProjectService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import ProjectMessages from "@/messages/ProjectMessages";

/**
 * GET handler for retrieving a project by its Id.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including projectId
 * @returns A NextResponse containing the project data or an error message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || searchParams.get('language') || 'en';

    const project = await ProjectService.getProjectById(projectId, language);

    if (!project) {
      return NextResponse.json(
        { message: ProjectMessages.PROJECT_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ project, language });

  }
  catch (error: any) {
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
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {

    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

    const { projectId } = await params;
    const project = await ProjectService.getProjectById(projectId);

    if (!project) {
      return NextResponse.json(
        { message: ProjectMessages.PROJECT_NOT_FOUND },
        { status: 404 }
      );
    }

    await ProjectService.deleteProject(project.projectId);

    return NextResponse.json(
      { message: ProjectMessages.PROJECT_DELETED_SUCCESSFULLY }
    );
  }
  catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
