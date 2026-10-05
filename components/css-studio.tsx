"use client";

import { useMemo, useState } from "react";
import { Braces, Check, FileCode2, Plus, Trash2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type CssFile={id:string;name:string;content:string;enabled:boolean};

function formatCss(source:string){
  let indent=0;
  return source.replace(/\/\*[\s\S]*?\*\//g,(comment)=>comment.trim()).replace(/\s*([{};])\s*/g,"$1\n").split("\n").map((line)=>line.trim()).filter(Boolean).map((line)=>{if(line.startsWith("}"))indent=Math.max(0,indent-1);const output=`${"  ".repeat(indent)}${line}`;if(line.endsWith("{"))indent+=1;return output;}).join("\n").replace(/;\n(\s*})/g,";\n$1");
}

function cssWarnings(value:string){
  const warnings:string[]=[];
  const opens=(value.match(/{/g)||[]).length;const closes=(value.match(/}/g)||[]).length;
  if(opens!==closes)warnings.push(`${opens} “{” / ${closes} “}”`);
  if(/<\/style/i.test(value))warnings.push("Remove </style> do CSS.");
  return warnings;
}

export function CssStudio({files,onChange}:{files:CssFile[];onChange:(files:CssFile[])=>void}){
  const [selectedId,setSelectedId]=useState(files[0]?.id??"");
  const selected=files.find((file)=>file.id===selectedId)??files[0];
  const warnings=useMemo(()=>cssWarnings(selected?.content??""),[selected?.content]);
  const update=(patch:Partial<CssFile>)=>selected&&onChange(files.map((file)=>file.id===selected.id?{...file,...patch}:file));
  const addFile=()=>{const id=crypto.randomUUID();const next={id,name:`custom-${files.length+1}.css`,content:"/* Made in Maia custom CSS */\n",enabled:true};onChange([...files,next]);setSelectedId(id);};
  const removeFile=()=>{if(!selected)return;const next=files.filter((file)=>file.id!==selected.id);onChange(next);setSelectedId(next[0]?.id??"");};
  const lines=(selected?.content??"").split("\n").length;

  return <section id="settings-css" className="mim-css-studio mt-5 scroll-mt-20 overflow-hidden bg-[#101010] text-[#f4f3ef] shadow-2xl">
    <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-6"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-[#d9ff43]"><Braces className="size-4"/>CSS Studio</p><h2 className="mt-1 text-2xl font-black uppercase">Custom project styles</h2></div><Button type="button" onClick={addFile} className="ml-auto rounded-none bg-[#d9ff43] text-black hover:bg-white"><Plus/>Novo ficheiro</Button></header>
    <div className="grid min-h-[560px] lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-white/10 bg-[#171717] p-3 lg:border-b-0 lg:border-r"><p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[.16em] text-white/35">Project CSS files</p><div className="grid gap-1">{files.map((file)=><button key={file.id} type="button" onClick={()=>setSelectedId(file.id)} className={`flex min-w-0 items-center gap-2 px-3 py-3 text-left text-xs font-bold ${selected?.id===file.id?"bg-white/10 text-white":"text-white/55 hover:bg-white/5"}`}><FileCode2 className="size-4 shrink-0 text-[#d9ff43]"/><span className="truncate">{file.name}</span>{file.enabled&&<span className="ml-auto size-1.5 rounded-full bg-[#d9ff43]"/>}</button>)}{!files.length&&<button type="button" onClick={addFile} className="border border-dashed border-white/15 p-5 text-xs text-white/45">Criar o primeiro ficheiro CSS</button>}</div></aside>
      {selected?<div className="min-w-0"><div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#151515] p-3"><Input value={selected.name} onChange={(event)=>update({name:event.target.value.replace(/[^a-zA-Z0-9._-]/g,"-")})} className="h-9 max-w-64 border-white/10 bg-black/30 font-mono text-xs text-white"/><label className="ml-auto flex items-center gap-2 text-xs font-bold uppercase text-white/55"><Switch checked={selected.enabled} onCheckedChange={(enabled)=>update({enabled})}/>{selected.enabled?"Ativo":"Inativo"}</label><Button type="button" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={()=>update({content:formatCss(selected.content)})}><WandSparkles/>Formatar</Button><Button type="button" size="icon" variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={removeFile} aria-label="Apagar ficheiro CSS"><Trash2/></Button></div><div className="relative grid min-h-[430px] grid-cols-[44px_minmax(0,1fr)] bg-[#0c0c0c]"><pre aria-hidden className="select-none border-r border-white/5 py-4 pr-3 text-right font-mono text-xs leading-6 text-white/20">{Array.from({length:lines},(_,index)=>index+1).join("\n")}</pre><textarea value={selected.content} onChange={(event)=>update({content:event.target.value})} onKeyDown={(event)=>{if(event.key==="Tab"){event.preventDefault();const input=event.currentTarget;const start=input.selectionStart;const end=input.selectionEnd;update({content:`${selected.content.slice(0,start)}  ${selected.content.slice(end)}`});requestAnimationFrame(()=>{input.selectionStart=input.selectionEnd=start+2;});}}} spellCheck={false} autoCapitalize="off" autoCorrect="off" data-language="css" className="min-h-[430px] w-full resize-y border-0 bg-transparent p-4 font-mono text-[13px] leading-6 text-[#e6e6e6] caret-[#d9ff43] outline-none" aria-label={`Editar ${selected.name}`}/></div><footer className="flex flex-wrap items-center gap-3 border-t border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/35"><span>CSS</span><span>{lines} linhas</span>{warnings.length?<span className="text-amber-300">{warnings.join(" · ")}</span>:<span className="ml-auto flex items-center gap-1 text-[#d9ff43]"><Check className="size-3"/>Sintaxe equilibrada</span>}</footer></div>:<div className="grid place-items-center p-8 text-center text-white/40"><div><FileCode2 className="mx-auto size-10"/><p className="mt-3 text-sm font-bold">Cria um ficheiro para começar.</p></div></div>}
    </div>
  </section>;
}
