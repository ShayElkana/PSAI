import { NextResponse } from "next/server";
import { getProfile, getRecentSessions } from "@/lib/memory/store";

export async function GET() {
  const profile = getProfile();
  const sessions = getRecentSessions(20);
  return NextResponse.json({ profile, sessions });
}
