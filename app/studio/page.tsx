"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, GripVertical, LayoutTemplate, Monitor, Package, Palette, Plus, Save, Smartphone, Store, Tablet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast, Toaster } from "sonner";

type Block = { id: number; type: string; title: string; description: string };

const initialBlocks: Block[] = [
  { id: 1, type: "Hero", title: "Veste uma ideia.", description: "T-shirts desenhadas e impressas na Maia." },
  { id: 2, type: "Produtos", title: "Novos na loja", description: "Grelha automática com os produtos mais recentes." },
  { id: 3, type: "Banner", title: "QR Edition", description: "Uma ligação pessoal, impressa na manga." },
];

export default function Studio() {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selected, setSelected] = useState(1);
  const [viewport, setViewport] = useState("desktop");
  const [published, setPublished] = useState(false);
  const current = useMemo(() => blocks.find((block) => block.id === selected) ?? blocks[0], [blocks, selected]);

  function updateBlock(patch: Partial<Block>) { setBlocks((items) => items.map((item) => item.id === selected ? { ...item, ...patch } : item)); }
  function move(index: number, offset: number) { const next = [...blocks]; const target = index + offset; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setBlocks(next); }
  function addBlock() { const id = Date.now(); setBlocks((items) => [...items, { id, type: "Texto", title: "Novo bloco", description: "Escreve aqui o conteúdo desta secção." }]); setSelected(id); }
  async function save() {
    const response = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Início", blocks, status: published ? "published" : "draft" }) });
    if (response.ok) toast.success(published ? "Página publicada" : "Rascunho guardado"); else toast.error("O modo de demonstração não conseguiu guardar na base de dados.");
  }

  const width = viewport === "mobile" ? "390px" : viewport === "tablet" ? "760px" : "100%";
  return (
    <main className="min-h-screen bg-[#ecece8] text-[#171713]">
      <Toaster position="bottom-right" />
      <header className="flex h-16 items-center gap-4 border-b border-black/10 bg-[#171713] px-5 text-white">
        <a href="/" className="flex items-center gap-2 font-black uppercase tracking-tight"><span className="grid size-8 place-items-center bg-[#ff4f1f]">M</span> Studio</a>
        <span className="h-6 w-px bg-white/20"/><span className="text-sm text-white/65">Página: Início</span>
        <div className="ml-auto flex items-center gap-2"><Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" asChild><a href="/" target="_blank"><Eye/>Pré-visualizar</a></Button><Button onClick={save} className="rounded-none bg-[#d9ff43] text-black hover:bg-[#c8ef39]"><Save/>Guardar</Button></div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[220px_minmax(0,1fr)_310px] max-lg:grid-cols-[72px_minmax(0,1fr)]">
        <aside className="border-r border-black/10 bg-white p-3">
          <nav className="grid gap-2">
            {[{icon:LayoutTemplate,label:"Páginas"},{icon:Palette,label:"Tema"},{icon:Package,label:"Produtos"},{icon:Store,label:"Encomendas"}].map(({icon:Icon,label}, index) => <Button key={label} variant={index === 0 ? "secondary" : "ghost"} className="justify-start rounded-none max-lg:px-3"><Icon/><span className="max-lg:hidden">{label}</span></Button>)}
          </nav>
        </aside>
        <section className="min-w-0 p-4 md:p-7">
          <div className="mb-4 flex items-center justify-between"><div className="flex gap-1 rounded-none bg-white p-1"><Button size="icon" variant={viewport === "desktop" ? "secondary" : "ghost"} onClick={() => setViewport("desktop")} aria-label="Desktop"><Monitor/></Button><Button size="icon" variant={viewport === "tablet" ? "secondary" : "ghost"} onClick={() => setViewport("tablet")} aria-label="Tablet"><Tablet/></Button><Button size="icon" variant={viewport === "mobile" ? "secondary" : "ghost"} onClick={() => setViewport("mobile")} aria-label="Telemóvel"><Smartphone/></Button></div><div className="flex items-center gap-2 text-sm"><Switch checked={published} onCheckedChange={setPublished}/>{published ? "Publicada" : "Rascunho"}</div></div>
          <div className="mx-auto min-h-[720px] overflow-hidden bg-[#f4f3ef] shadow-xl transition-[width]" style={{ width }}>
            <div className="flex h-14 items-center border-b border-black/10 px-6"><strong className="uppercase tracking-tight">Made in Maia</strong><span className="ml-auto text-sm">Loja &nbsp; Coleções &nbsp; QR</span></div>
            <div className="space-y-3 p-4 md:p-6">{blocks.map((block, index) => <button key={block.id} onClick={() => setSelected(block.id)} className={`group block w-full border-2 p-5 text-left ${selected === block.id ? "border-[#ff4f1f]" : "border-transparent hover:border-black/15"} ${block.type === "Hero" ? "min-h-64 bg-[#ff4f1f] text-white" : block.type === "Produtos" ? "min-h-48 bg-white" : "min-h-32 bg-[#d9ff43]"}`}><span className="text-xs font-bold uppercase tracking-widest opacity-60">{block.type}</span><h2 className={`${block.type === "Hero" ? "mt-14 text-5xl" : "mt-4 text-2xl"} font-black uppercase tracking-[-.05em]`}>{block.title}</h2><p className="mt-2 opacity-70">{block.description}</p><span className="mt-4 inline-flex gap-1 opacity-0 group-hover:opacity-100"><span onClick={(event) => { event.stopPropagation(); move(index,-1); }} className="bg-black/10 p-1"><ArrowUp className="size-4"/></span><span onClick={(event) => { event.stopPropagation(); move(index,1); }} className="bg-black/10 p-1"><ArrowDown className="size-4"/></span></span></button>)}</div>
          </div>
        </section>
        <aside className="border-l border-black/10 bg-white p-5 max-lg:hidden">
          <Tabs defaultValue="content"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="content">Conteúdo</TabsTrigger><TabsTrigger value="style">Estilo</TabsTrigger></TabsList><TabsContent value="content" className="space-y-5 pt-5"><div><label className="mb-2 block text-sm font-semibold">Tipo de bloco</label><Select value={current?.type} onValueChange={(value) => updateBlock({type:value})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Hero">Hero</SelectItem><SelectItem value="Produtos">Produtos</SelectItem><SelectItem value="Banner">Banner</SelectItem><SelectItem value="Texto">Texto</SelectItem></SelectContent></Select></div><div><label className="mb-2 block text-sm font-semibold">Título</label><Input value={current?.title ?? ""} onChange={(event) => updateBlock({title:event.target.value})}/></div><div><label className="mb-2 block text-sm font-semibold">Descrição</label><textarea value={current?.description ?? ""} onChange={(event) => updateBlock({description:event.target.value})} className="min-h-28 w-full border border-input p-3 outline-none focus:ring-2 focus:ring-ring"/></div><Button onClick={addBlock} variant="outline" className="w-full rounded-none"><Plus/>Adicionar bloco</Button><Button onClick={() => setBlocks((items) => items.filter((item) => item.id !== selected))} variant="ghost" className="w-full rounded-none text-red-600"><Trash2/>Remover bloco</Button></TabsContent><TabsContent value="style" className="space-y-5 pt-5"><div><label className="mb-2 block text-sm font-semibold">Fundo</label><div className="grid grid-cols-4 gap-2">{["#ff4f1f","#d9ff43","#171713","#ffffff"].map((color)=><button key={color} className="aspect-square border" style={{backgroundColor:color}} aria-label={`Cor ${color}`}/>)}</div></div><div><label className="mb-2 block text-sm font-semibold">Largura</label><Select defaultValue="full"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="full">Largura total</SelectItem><SelectItem value="content">Conteúdo</SelectItem><SelectItem value="narrow">Estreita</SelectItem></SelectContent></Select></div></TabsContent></Tabs>
          <div className="mt-8 border-t pt-5"><p className="flex items-center gap-2 text-sm font-semibold"><GripVertical className="size-4"/>Estrutura da página</p><ol className="mt-3 space-y-2">{blocks.map((block)=><li key={block.id}><button onClick={()=>setSelected(block.id)} className={`w-full px-3 py-2 text-left text-sm ${selected===block.id?"bg-[#fff0ea] text-[#d33b10]":"bg-[#f5f5f2]"}`}>{block.type} · {block.title}</button></li>)}</ol></div>
        </aside>
      </div>
    </main>
  );
}
