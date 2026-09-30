import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isAuthenticated(request: Request) {
  const expected = process.env.STUDIO_PASSWORD;
  return Boolean(expected && request.headers.get("x-studio-key") === expected);
}

export async function POST(request: Request) {
  if (!isAuthenticated(request))
    return NextResponse.json(
      { error: "Autenticação necessária" },
      { status: 401 },
    );

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset)
    return NextResponse.json(
      { error: "O upload Cloudinary ainda não está configurado no Render." },
      { status: 503 },
    );

  const input = await request.formData();
  const file = input.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/"))
    return NextResponse.json({ error: "Seleciona uma imagem válida." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE)
    return NextResponse.json(
      { error: "A imagem não pode exceder 10 MB." },
      { status: 413 },
    );

  const form = new FormData();
  form.set("file", file);
  form.set("upload_preset", uploadPreset);
  form.set("folder", "madeinmaia-shop");

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      { method: "POST", body: form },
    );
    const result = (await response.json()) as {
      secure_url?: string;
      error?: { message?: string };
    };
    if (!response.ok || !result.secure_url)
      return NextResponse.json(
        { error: result.error?.message || "O Cloudinary recusou o upload." },
        { status: 502 },
      );
    return NextResponse.json({ url: result.secure_url });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível contactar o Cloudinary." },
      { status: 502 },
    );
  }
}
