import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES:Record<string,string> = { ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".png":"image/png", ".webp":"image/webp", ".gif":"image/gif" };
const VARIANT=/^([a-z0-9-]+?)-w(?:160|480|960|1600)\.webp$/i;

function serve(bytes:Buffer, filename:string, cacheControl:string) {
  return new Response(new Uint8Array(bytes),{headers:{"content-type":CONTENT_TYPES[path.extname(filename).toLowerCase()]||"application/octet-stream","cache-control":cacheControl,"x-content-type-options":"nosniff"}});
}

export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}) {
  const {filename}=await params;
  if (!/^[a-z0-9-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(filename)) return NextResponse.json({error:"Imagem inválida"},{status:400});
  const directory=path.resolve(process.env.UPLOADS_DIR||path.join(process.cwd(),"public","uploads"));
  try {
    return serve(await readFile(path.join(directory,filename)),filename,"public, max-age=2592000, immutable");
  } catch {
    // A crunched copy that does not exist yet: serve the original for now, briefly cached so the copy takes over once made.
    const stem=filename.match(VARIANT)?.[1];
    if (stem) for (const extension of ["png","jpg","jpeg","webp"]) {
      const original=`${stem}.${extension}`;
      const bytes=await readFile(path.join(directory,original)).catch(()=>null);
      if (bytes) return serve(bytes,original,"public, max-age=300");
    }
    return NextResponse.json({error:"Imagem não encontrada"},{status:404});
  }
}
