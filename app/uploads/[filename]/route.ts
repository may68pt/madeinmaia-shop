import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES:Record<string,string> = { ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".png":"image/png", ".webp":"image/webp" };

export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}) {
  const {filename}=await params;
  if (!/^[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/i.test(filename)) return NextResponse.json({error:"Imagem inválida"},{status:400});
  const directory=path.resolve(process.env.UPLOADS_DIR||path.join(process.cwd(),"public","uploads"));
  try {
    const bytes=await readFile(path.join(directory,filename));
    return new Response(bytes,{headers:{"content-type":CONTENT_TYPES[path.extname(filename).toLowerCase()]||"application/octet-stream","cache-control":"public, max-age=2592000, immutable","x-content-type-options":"nosniff"}});
  } catch {
    return NextResponse.json({error:"Imagem não encontrada"},{status:404});
  }
}
