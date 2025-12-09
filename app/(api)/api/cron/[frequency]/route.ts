import { NextRequest, NextResponse } from "next/server";
import CronService from "@/services/CronService";
import Logger from "@/libs/logger";

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(request: NextRequest, { params }: { params: { frequency: string } }) {
  const { frequency } = await params;
  const secret = request.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    Logger.warn("Unauthorized cron access");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await CronService.run(frequency);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
