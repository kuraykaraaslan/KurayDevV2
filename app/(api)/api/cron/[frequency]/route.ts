import { NextRequest, NextResponse } from "next/server";
import CronService from "@/services/CronService";
import Logger from "@/libs/logger";
import { StatFrequency, StatFrequencySchema } from '@/types/common';
import { CronRunRequestSchema } from "@/dtos/CronDTO";

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(request: NextRequest, { params }: { params: { frequency: StatFrequency } }) {
  const secret = request.headers.get("x-cron-secret");

  if (secret !== CRON_SECRET) {
    Logger.warn("Unauthorized cron access");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const _params = await params;

  const frequency = StatFrequencySchema.safeParse(_params.frequency);

  if (!frequency.success) {
    Logger.error(`Invalid cron frequency: ${params.frequency}`);
    return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
  }

  try {
    const result = await CronService.run(frequency.data);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
