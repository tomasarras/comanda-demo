import { NextResponse } from "next/server";
import { resetDemoData } from "@/lib/demoReset";

export async function POST() {
  try {
    await resetDemoData();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("demo reset failed", err);
    return NextResponse.json({ error: "No se pudo restablecer la demo" }, { status: 500 });
  }
}

// Invocado por el Vercel Cron Job (vercel.json) para restablecer la demo
// todos los días. Vercel siempre llama a los crons por GET.
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await resetDemoData();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("demo reset failed", err);
    return NextResponse.json({ error: "No se pudo restablecer la demo" }, { status: 500 });
  }
}
