import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "singleton";

function serialize(settings) {
  return { ...settings, deliveryFee: Number(settings.deliveryFee) };
}

export async function getSettings() {
  const settings = await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
  return serialize(settings);
}

export async function updateSettings({ deliveryFee }) {
  const data = {};
  if (deliveryFee !== undefined) data.deliveryFee = deliveryFee;

  const settings = await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  });
  return serialize(settings);
}
