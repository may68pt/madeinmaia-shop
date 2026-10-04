import { randomUUID } from "node:crypto";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES:Record<string,string> = { "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp" };

function isAuthenticated(request: Request) {
  const expectedPassword = process.env.STUDIO_PASSWORD;
  const expectedUser = process.env.STUDIO_USERNAME || "madeinmaia";
  return Boolean(expectedPassword && request.headers.get("x-studio-user") === expectedUser && request.headers.get("x-studio-key") === expectedPassword);
}

function uploadDirectory() {
  return path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads"));
}

function publicUrl(filename:string) {
  const base = (process.env.UPLOADS_PUBLIC_URL || "/uploads").replace(/\/$/, "");
  return `${base}/${filename}`;
}

function hasValidSignature(bytes:Uint8Array, type:string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0,8).every((value,index)=>value===[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][index]);
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP";
  return false;
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error:"Autenticação necessária" }, { status:401 });
  const input = await request.formData();
  const file = input.get("file");
  if (!(file instanceof File) || !ALLOWED_TYPES[file.type]) return NextResponse.json({ error:"Seleciona uma imagem JPG, PNG ou WebP." }, { status:400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error:"A imagem não pode exceder 10 MB." }, { status:413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes,file.type)) return NextResponse.json({ error:"O conteúdo do ficheiro não corresponde a uma imagem válida." }, { status:400 });

  const directory = uploadDirectory();
  const stem = path.basename(file.name,path.extname(file.name)).normalize("NFKD").replace(/[^a-zA-Z0-9-]+/g,"-").replace(/^-|-$/g,"").toLowerCase().slice(0,60) || "imagem";
  const filename = `${stem}-${randomUUID().slice(0,8)}.${ALLOWED_TYPES[file.type]}`;
  const temporaryPath = path.join(directory,`.${filename}.tmp`);
  try {
    await mkdir(directory,{recursive:true});
    await writeFile(temporaryPath,bytes,{flag:"wx"});
    await rename(temporaryPath,path.join(directory,filename));
    return NextResponse.json({url:publicUrl(filename),filename});
  } catch {
    await unlink(temporaryPath).catch(()=>undefined);
    return NextResponse.json({ error:"Não foi possível guardar a imagem no servidor." }, { status:500 });
  }
}
