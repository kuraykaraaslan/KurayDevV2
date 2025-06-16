import { NextResponse } from "next/server";
import GitlabService from "@/services/GitlabService";

export async function GET() {
  try {
    const data = await GitlabService.getMockContributions();
    return NextResponse.json({ message: "Success", data });
  } catch (error) {
    return NextResponse.json({ message: "Error", error }, { status: 500 });
  }
}
