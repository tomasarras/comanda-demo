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
