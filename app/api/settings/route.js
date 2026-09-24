import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request) {
  const body = await request.json();
  const deliveryFee = Number(body.deliveryFee);
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
    return NextResponse.json({ error: "Costo de envío inválido" }, { status: 400 });
  }
  const settings = await updateSettings({ deliveryFee });
  return NextResponse.json(settings);
}
