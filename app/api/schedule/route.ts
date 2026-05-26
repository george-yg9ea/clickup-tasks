import { auth } from "@/auth";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

type Schedule = Record<string, Record<string, number>>;

function key(email: string) {
  return `schedule:${email}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 });
  const data = await redis.get<Schedule>(key(session.user.email));
  return NextResponse.json(data ?? {});
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 });
  const schedule: Schedule = await req.json();
  await redis.set(key(session.user.email), schedule);
  return NextResponse.json({ ok: true });
}
