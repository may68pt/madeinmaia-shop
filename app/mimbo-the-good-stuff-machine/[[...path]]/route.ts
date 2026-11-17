// MiM Catálogo 16 · serves the app (catalogo-app/) behind the Studio login, plus uploaded media.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { authorized, catalogoDir } from "@/lib/catalogo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const APP_DIR = path.resolve(process.cwd(), "catalogo-app");
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".js": "text/javascript" };
const PUBLIC = new Set(["sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon.png"]);

const LOGIN = `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="MiMBO"><meta name="theme-color" content="#14112b">
<title>MiM Catálogo 16 · Entrar</title><link rel="manifest" href="/mimbo-the-good-stuff-machine/manifest.webmanifest"><link rel="apple-touch-icon" href="/mimbo-the-good-stuff-machine/apple-touch-icon.png"><meta name="theme-color" content="#14112b"><meta name="apple-mobile-web-app-capable" content="yes">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 15% -10%,#3b2a7a 0,transparent 45%),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 2px,transparent 2px 4px),#14112b;color:#f4f0e6;font:22px VT323,monospace}
form{background:#2d2660;padding:28px;width:min(360px,90vw);box-shadow:0 -4px 0 #0a0818,0 4px 0 #0a0818,-4px 0 0 #0a0818,4px 0 0 #0a0818,inset 4px 4px 0 #3a3178}
h1{font:14px "Press Start 2P";margin:0 0 6px;text-shadow:3px 3px 0 #ff4f1f,6px 6px 0 #0a0818}p{color:#a9a2d6;margin:8px 0 18px}
input{display:block;width:100%;box-sizing:border-box;margin:0 0 14px;font:22px VT323;color:#f4f0e6;background:#0a0818;border:0;padding:8px 10px;box-shadow:0 0 0 3px #4b40a0;outline:none}input:focus{box-shadow:0 0 0 3px #ffd23f}
button{font:11px "Press Start 2P";color:#fff;background:#ff4f1f;border:0;padding:14px;width:100%;cursor:pointer;box-shadow:inset 0 -5px 0 #b8330f,inset 0 4px 0 #ff8a5c}#e{color:#ff3b5c;min-height:24px}</style></head>
<body><form id="f"><h1>MIM CATÁLOGO 16</h1><p>Entra com o utilizador e a password do Studio.</p><input name="user" autocomplete="username" placeholder="utilizador" value="madeinmaia"><input name="pass" type="password" autocomplete="current-password" placeholder="password" autofocus><div id="e"></div><button>▶ ENTRAR</button></form>
<script>f.onsubmit=async e=>{e.preventDefault();const r=await fetch("/api/mimbo-the-good-stuff-machine/login",{method:"POST",body:new FormData(f)});if(r.ok)location.reload();else document.getElementById("e").textContent=(await r.json().catch(()=>({}))).error||"Erro"}</script><script>if("serviceWorker" in navigator)navigator.serviceWorker.register("/mimbo-the-good-stuff-machine/sw.js",{scope:"/mimbo-the-good-stuff-machine/"}).catch(()=>{})</script></body></html>`;

export async function GET(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path: parts = [] } = await params;
  // Next strips the trailing slash, so the app is served at /mimbo-the-good-stuff-machine itself; index.html carries <base href="/mimbo-the-good-stuff-machine/">.
  const rel = parts.join("/") || "index.html";
  if (rel.includes("..") || rel.startsWith(".")) return new Response("Not found", { status: 404 });
  const ok = authorized(request);
  if (!ok && !PUBLIC.has(rel)) {
    if (rel === "index.html") return new Response(LOGIN, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
    return NextResponse.json({ error: "login" }, { status: 401 });
  }
  const file = parts[0] === "media" ? catalogoDir("media", path.basename(rel)) : path.join(APP_DIR, rel);
  if (!file.startsWith(parts[0] === "media" ? catalogoDir("media") : APP_DIR)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    const immutable = /\/(designs|media)\//.test("/" + rel);
    return new Response(bytes, { headers: { "content-type": TYPES[ext] || "application/octet-stream", "cache-control": rel === "index.html" || rel === "sw.js" || rel === "manifest.webmanifest" ? "no-cache" : immutable ? "private, max-age=2592000" : "private, max-age=3600", "x-content-type-options": "nosniff", "x-frame-options": "DENY", "x-robots-tag": "noindex, nofollow", ...(parts[0] === "media" ? { "content-security-policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox" } : {}) } });
  } catch { return new Response("Not found", { status: 404 }); }
}
