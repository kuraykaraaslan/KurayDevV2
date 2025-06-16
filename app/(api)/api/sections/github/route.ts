"use server";

import { NextRequest, NextResponse } from "next/server";
import GithubService from "@/services/GithubService";

export async function GET(req: NextRequest) {
  try {
    const data = await GithubService.getContributionCalendar();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error }, { status: 500 });
  }
}