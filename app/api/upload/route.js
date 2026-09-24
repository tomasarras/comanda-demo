import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (!file.type?.startsWith("image/")) {
    return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "La imagen no puede pesar más de 5MB" }, { status: 400 });
  }

  try {
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json(
      { error: "No se pudo subir la imagen. Falta configurar el almacenamiento (BLOB_READ_WRITE_TOKEN)." },
      { status: 500 },
    );
  }
}
