"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  GripVertical,
  Images,
  LayoutTemplate,
  LockKeyhole,
  Monitor,
  Package,
  Palette,
  Plus,
  Save,
  Settings,
  Smartphone,
  Store,
  Tablet,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast, Toaster } from "sonner";
import { PRODUCT_COLORS } from "@/lib/product-colors";
import { PRODUCT_TYPES, type ProductVariant } from "@/lib/product-variants";

type Block = { id: number; type: string; title: string; description: string };
type Discovery = {
  id: number;
  title: string;
  type: string;
  body: string;
  mediaUrl: string;
  linkUrl: string;
  linkLabel: string;
  weight: number;
  active: boolean;
};
type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  collection: string;
  imageKey: string;
  colors: string[];
  sizes: string[];
  variants: ProductVariant[];
  status: "draft" | "published";
};
type Order = {
  id: number;
  reference: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: Partial<{
    address: string;
    postalCode: string;
    city: string;
    country: string;
  }>;
  items: Array<{
    slug: string;
    name: string;
    color: string;
    size: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  shippingCents: number;
  totalCents: number;
  status: string;
  paymentProvider: string | null;
  createdAt: string;
};
type SiteSettings = {
  brandName: string;
  contactEmail: string;
  announcement: string;
  seoTitle: string;
  seoDescription: string;
  instagramUrl: string;
  facebookUrl: string;
  terms: string;
  privacy: string;
  returns: string;
  media: Array<{ url: string; alt: string }>;
  theme: {
    brandColor: string;
    accentColor: string;
    darkColor: string;
    backgroundColor: string;
  };
};

const initialBlocks: Block[] = [
  {
    id: 1,
    type: "Hero",
    title: "Veste uma ideia.",
    description: "T-shirts desenhadas e impressas na Maia.",
  },
  {
    id: 2,
    type: "Produtos",
    title: "Novos na loja",
    description: "Grelha automática com os produtos mais recentes.",
  },
  {
    id: 3,
    type: "Banner",
    title: "QR Edition",
    description: "Uma ligação pessoal, impressa na manga.",
  },
];

const initialDiscoveries: Discovery[] = [
  {
    id: 1,
    title: "Hoje encontraste a Maia.",
    type: "text",
    body: "Uma ideia local, feita para viajar contigo.",
    mediaUrl: "",
    linkUrl: "/marca",
    linkLabel: "Conhecer a marca",
    weight: 1,
    active: true,
  },
];

const initialProducts: Product[] = [
  {
    id: 1,
    slug: "guardiao-zen",
    name: "Guardião Zen",
    description: "",
    priceCents: 2000,
    collection: "Made in Maia",
    imageKey: "/products/white-shirt-1.jpg",
    colors: ["Branco"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    variants: [],
    status: "published",
  },
  {
    id: 2,
    slug: "piramide-digital",
    name: "Pirâmide Digital",
    description: "",
    priceCents: 2000,
    collection: "Pop Culture",
    imageKey: "/products/red-shirt-1.jpg",
    colors: ["Vermelho"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    variants: [],
    status: "published",
  },
  {
    id: 3,
    slug: "los-robots",
    name: "Los Robots",
    description: "",
    priceCents: 2000,
    collection: "Música",
    imageKey: "/products/blue-shirt-1.jpg",
    colors: ["Azul"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    variants: [],
    status: "published",
  },
];
const initialSettings: SiteSettings = {
  brandName: "Made in Maia",
  contactEmail: "",
  announcement:
    "Produzido na Maia · Envio gratuito em Portugal a partir de 45 €",
  seoTitle: "Made in Maia — T-shirts com ideias",
  seoDescription: "T-shirts desenhadas e impressas na Maia.",
  instagramUrl: "",
  facebookUrl: "",
  terms: "",
  privacy: "",
  returns: "",
  media: [],
  theme: {
    brandColor: "#ff4f1f",
    accentColor: "#d9ff43",
    darkColor: "#171713",
    backgroundColor: "#f4f3ef",
  },
};

export default function Studio() {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selected, setSelected] = useState(1);
  const [viewport, setViewport] = useState("desktop");
  const [published, setPublished] = useState(false);
  const [studioKey, setStudioKey] = useState("");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState<
    "pages" | "products" | "discover" | "orders" | "media" | "settings"
  >("pages");
  const [discoveries, setDiscoveries] = useState(initialDiscoveries);
  const [catalogue, setCatalogue] = useState(initialProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentConfigured, setPaymentConfigured] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [uploading, setUploading] = useState(false);
  const current = useMemo(
    () => blocks.find((block) => block.id === selected) ?? blocks[0],
    [blocks, selected],
  );

  function updateBlock(patch: Partial<Block>) {
    setBlocks((items) =>
      items.map((item) =>
        item.id === selected ? { ...item, ...patch } : item,
      ),
    );
  }
  function move(index: number, offset: number) {
    const next = [...blocks];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
  }
  function addBlock() {
    const id = Date.now();
    setBlocks((items) => [
      ...items,
      {
        id,
        type: "Texto",
        title: "Novo bloco",
        description: "Escreve aqui o conteúdo desta secção.",
      },
    ]);
    setSelected(id);
  }
  async function save() {
    if (section === "settings") {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studio-key": studioKey,
        },
        body: JSON.stringify({ resource: "settings", entries: [settings] }),
      });
      if (response.ok) toast.success("Definições guardadas");
      else toast.error("Não foi possível guardar as definições.");
      return;
    }
    if (section === "media") {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studio-key": studioKey,
        },
        body: JSON.stringify({ resource: "settings", entries: [settings] }),
      });
      if (response.ok) toast.success("Biblioteca guardada");
      else toast.error("Não foi possível guardar a biblioteca.");
      return;
    }
    if (section === "orders") {
      toast.info("Os estados das encomendas são guardados imediatamente.");
      return;
    }
    if (section === "products") {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studio-key": studioKey,
        },
        body: JSON.stringify({ resource: "products", entries: catalogue }),
      });
      if (response.ok) toast.success("Catálogo guardado");
      else toast.error("Não foi possível guardar o catálogo.");
      return;
    }
    if (section === "discover") {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studio-key": studioKey,
        },
        body: JSON.stringify({
          resource: "random-content",
          entries: discoveries,
        }),
      });
      if (response.ok) toast.success("Conteúdos de Descobre guardados");
      else toast.error("Não foi possível guardar os conteúdos.");
      return;
    }
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-studio-key": studioKey,
      },
      body: JSON.stringify({
        title: "Início",
        blocks,
        status: published ? "published" : "draft",
      }),
    });
    if (response.ok)
      toast.success(published ? "Página publicada" : "Rascunho guardado");
    else if (response.status === 401) {
      setStudioKey("");
      toast.error("A palavra-passe não é válida.");
    } else toast.error("Não foi possível guardar na base de dados.");
  }

  async function unlock(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/studio", {
      headers: { "x-studio-key": password },
    });
    if (!response.ok) {
      toast.error("A palavra-passe não é válida.");
      return;
    }
    const data = (await response.json()) as {
      randomContent?: Array<Partial<Discovery> & { id: number }>;
      products?: Array<Partial<Product> & { id: number }>;
      orders?: Order[];
      paymentConfigured?: boolean;
      settings?: SiteSettings | null;
    };
    if (data.randomContent?.length)
      setDiscoveries(
        data.randomContent.map((entry) => ({
          id: entry.id,
          title: entry.title ?? "",
          type: entry.type ?? "text",
          body: entry.body ?? "",
          mediaUrl: entry.mediaUrl ?? "",
          linkUrl: entry.linkUrl ?? "",
          linkLabel: entry.linkLabel ?? "Descobrir",
          weight: entry.weight ?? 1,
          active: entry.active !== false,
        })),
      );
    if (data.products?.length)
      setCatalogue(
        data.products.map((entry) => ({
          id: entry.id,
          slug: entry.slug ?? "",
          name: entry.name ?? "",
          description: entry.description ?? "",
          priceCents: entry.priceCents ?? 0,
          collection: entry.collection ?? "Made in Maia",
          imageKey: entry.imageKey ?? "",
          colors: entry.colors ?? [],
          sizes: entry.sizes ?? [],
          variants: (entry.variants ?? []).map((variant) => ({
            ...variant,
            type: variant.type ?? "adult-tshirt",
            active: variant.active !== false,
          })),
          status: entry.status === "published" ? "published" : "draft",
        })),
      );
    setOrders(data.orders ?? []);
    setPaymentConfigured(Boolean(data.paymentConfigured));
    if (data.settings)
      setSettings({
        ...initialSettings,
        ...data.settings,
        theme: { ...initialSettings.theme, ...data.settings.theme },
        media: data.settings.media ?? [],
      });
    setStudioKey(password);
    setPassword("");
  }

  function updateDiscovery(id: number, patch: Partial<Discovery>) {
    setDiscoveries((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  function updateProduct(id: number, patch: Partial<Product>) {
    setCatalogue((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  async function updateOrderStatus(reference: string, status: string) {
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-studio-key": studioKey,
      },
      body: JSON.stringify({ resource: "order-status", reference, status }),
    });
    if (response.ok) {
      setOrders((items) =>
        items.map((item) =>
          item.reference === reference ? { ...item, status } : item,
        ),
      );
      toast.success("Estado atualizado");
    } else toast.error("Não foi possível atualizar o estado.");
  }

  async function uploadMedia(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "x-studio-key": studioKey },
        body: form,
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url)
        throw new Error(data.error || "Não foi possível carregar a imagem.");
      setSettings((current) => ({
        ...current,
        media: [
          ...current.media,
          { url: data.url!, alt: file.name.replace(/\.[^.]+$/, "") },
        ],
      }));
      toast.success("Imagem carregada. Guarda as definições para a adicionar à biblioteca.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }

  if (!studioKey)
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--ink)] p-6 text-white">
        <Toaster position="bottom-right" />
        <form
          onSubmit={unlock}
          className="w-full max-w-md bg-[var(--paper)] p-8 text-[var(--ink)]"
        >
          <span className="grid size-12 place-items-center bg-[var(--brand)] text-white">
            <LockKeyhole />
          </span>
          <h1 className="mt-6 text-4xl font-black uppercase tracking-[-.055em]">
            Made in Maia Studio
          </h1>
          <p className="mt-3 text-black/60">
            Introduz a palavra-passe definida no serviço Render.
          </p>
          <label
            className="mt-7 block text-sm font-semibold"
            htmlFor="studio-password"
          >
            Palavra-passe
          </label>
          <Input
            id="studio-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-12"
            autoFocus
            required
          />
          <Button
            type="submit"
            className="mt-4 h-12 w-full rounded-none bg-[var(--ink)] text-white"
          >
            Entrar no Studio
          </Button>
          <Link href="/" className="mt-5 block text-center text-sm underline">
            Voltar à loja
          </Link>
        </form>
      </main>
    );

  const width =
    viewport === "mobile" ? "390px" : viewport === "tablet" ? "760px" : "100%";
  return (
    <main className="min-h-screen bg-[#ecece8] text-[var(--ink)]">
      <Toaster position="bottom-right" />
      <header className="flex h-16 items-center gap-4 border-b border-black/10 bg-[var(--ink)] px-5 text-white">
        <Link
          href="/"
          className="flex items-center gap-2 font-black uppercase tracking-tight"
        >
          <span className="grid size-8 place-items-center bg-[var(--brand)]">M</span>{" "}
          Studio
        </Link>
        <span className="h-6 w-px bg-white/20" />
        <span className="text-sm text-white/65">
          {section === "pages"
            ? "Página: Início"
            : section === "discover"
              ? "Conteúdo: Descobre"
              : section === "orders"
                ? "Encomendas"
                : section === "media"
                  ? "Biblioteca de media"
                : section === "settings"
                  ? "Definições"
                  : "Catálogo"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/" target="_blank">
              <Eye />
              Pré-visualizar
            </Link>
          </Button>
          <Button
            onClick={save}
            className="rounded-none bg-[var(--accent-brand)] text-black hover:bg-[#c8ef39]"
          >
            <Save />
            Guardar
          </Button>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[220px_minmax(0,1fr)_310px] max-lg:grid-cols-[72px_minmax(0,1fr)]">
        <aside className="border-r border-black/10 bg-white p-3">
          <nav className="grid gap-2">
            {[
              { icon: LayoutTemplate, label: "Páginas", value: "pages" },
              { icon: Palette, label: "Descobre", value: "discover" },
              { icon: Package, label: "Produtos", value: "products" },
              { icon: Images, label: "Media", value: "media" },
              { icon: Store, label: "Encomendas", value: "orders" },
              { icon: Settings, label: "Definições", value: "settings" },
            ].map(({ icon: Icon, label, value }) => (
              <Button
                key={label}
                onClick={() => setSection(value as typeof section)}
                variant={section === value ? "secondary" : "ghost"}
                className="justify-start rounded-none max-lg:px-3"
              >
                <Icon />
                <span className="max-lg:hidden">{label}</span>
              </Button>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 p-4 md:p-7">
          {section === "pages" ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-1 rounded-none bg-white p-1">
                  <Button
                    size="icon"
                    variant={viewport === "desktop" ? "secondary" : "ghost"}
                    onClick={() => setViewport("desktop")}
                    aria-label="Desktop"
                  >
                    <Monitor />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewport === "tablet" ? "secondary" : "ghost"}
                    onClick={() => setViewport("tablet")}
                    aria-label="Tablet"
                  >
                    <Tablet />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewport === "mobile" ? "secondary" : "ghost"}
                    onClick={() => setViewport("mobile")}
                    aria-label="Telemóvel"
                  >
                    <Smartphone />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Switch checked={published} onCheckedChange={setPublished} />
                  {published ? "Publicada" : "Rascunho"}
                </div>
              </div>
              <div
                className="mx-auto min-h-[720px] overflow-hidden bg-[var(--paper)] shadow-xl transition-[width]"
                style={{ width }}
              >
                <div className="flex h-14 items-center border-b border-black/10 px-6">
                  <strong className="uppercase tracking-tight">
                    Made in Maia
                  </strong>
                  <span className="ml-auto text-sm">
                    Loja &nbsp; Coleções &nbsp; QR
                  </span>
                </div>
                <div className="space-y-3 p-4 md:p-6">
                  {blocks.map((block, index) => (
                    <button
                      key={block.id}
                      onClick={() => setSelected(block.id)}
                      className={`group block w-full border-2 p-5 text-left ${selected === block.id ? "border-[var(--brand)]" : "border-transparent hover:border-black/15"} ${block.type === "Hero" ? "min-h-64 bg-[var(--brand)] text-white" : block.type === "Produtos" ? "min-h-48 bg-white" : "min-h-32 bg-[var(--accent-brand)]"}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">
                        {block.type}
                      </span>
                      <h2
                        className={`${block.type === "Hero" ? "mt-14 text-5xl" : "mt-4 text-2xl"} font-black uppercase tracking-[-.05em]`}
                      >
                        {block.title}
                      </h2>
                      <p className="mt-2 opacity-70">{block.description}</p>
                      <span className="mt-4 inline-flex gap-1 opacity-0 group-hover:opacity-100">
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            move(index, -1);
                          }}
                          className="bg-black/10 p-1"
                        >
                          <ArrowUp className="size-4" />
                        </span>
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            move(index, 1);
                          }}
                          className="bg-black/10 p-1"
                        >
                          <ArrowDown className="size-4" />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : section === "discover" ? (
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">
                    madeinmaia.pt/descobre
                  </p>
                  <h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">
                    Conteúdo aleatório
                  </h1>
                  <p className="mt-3 max-w-2xl text-black/60">
                    Cada leitura do QR escolhe um destes conteúdos ativos. O
                    peso aumenta a frequência relativa.
                  </p>
                </div>
                <Button asChild variant="outline" className="rounded-none">
                  <Link href="/descobre" target="_blank">
                    <Eye />
                    Testar
                  </Link>
                </Button>
              </div>
              <div className="space-y-4">
                {discoveries.map((entry, index) => (
                  <article key={entry.id} className="bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid size-8 place-items-center bg-[var(--ink)] text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <Input
                        value={entry.title}
                        onChange={(event) =>
                          updateDiscovery(entry.id, {
                            title: event.target.value,
                          })
                        }
                        className="h-11 text-lg font-bold"
                      />
                      <Switch
                        checked={entry.active}
                        onCheckedChange={(active) =>
                          updateDiscovery(entry.id, { active })
                        }
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setDiscoveries((items) =>
                            items.filter((item) => item.id !== entry.id),
                          )
                        }
                        aria-label="Remover"
                      >
                        <Trash2 className="text-red-600" />
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase">
                          Mensagem
                        </label>
                        <textarea
                          value={entry.body}
                          onChange={(event) =>
                            updateDiscovery(entry.id, {
                              body: event.target.value,
                            })
                          }
                          className="min-h-24 w-full border border-input p-3"
                        />
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase">
                            Link de destino
                          </label>
                          <Input
                            value={entry.linkUrl}
                            onChange={(event) =>
                              updateDiscovery(entry.id, {
                                linkUrl: event.target.value,
                              })
                            }
                            placeholder="/marca ou https://..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={entry.linkLabel}
                            onChange={(event) =>
                              updateDiscovery(entry.id, {
                                linkLabel: event.target.value,
                              })
                            }
                            placeholder="Texto do botão"
                          />
                          <Input
                            type="number"
                            min="1"
                            value={entry.weight}
                            onChange={(event) =>
                              updateDiscovery(entry.id, {
                                weight: Number(event.target.value),
                              })
                            }
                            aria-label="Peso"
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <Button
                onClick={() =>
                  setDiscoveries((items) => [
                    ...items,
                    {
                      id: Date.now(),
                      title: "Nova surpresa",
                      type: "text",
                      body: "Escreve aqui a mensagem.",
                      mediaUrl: "",
                      linkUrl: "",
                      linkLabel: "Descobrir",
                      weight: 1,
                      active: true,
                    },
                  ])
                }
                className="mt-5 rounded-none bg-[var(--ink)] text-white"
              >
                <Plus />
                Adicionar conteúdo
              </Button>
            </div>
          ) : section === "orders" ? (
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">
                    Operação
                  </p>
                  <h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">
                    Encomendas
                  </h1>
                  <p className="mt-3 text-black/60">
                    {orders.length} encomenda{orders.length === 1 ? "" : "s"} ·
                    pagamento{" "}
                    {paymentConfigured ? "configurado" : "por configurar"}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 text-xs font-black uppercase ${paymentConfigured ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                >
                  {paymentConfigured ? "Pagamento ativo" : "Modo manual"}
                </span>
              </div>
              {orders.length === 0 ? (
                <div className="grid min-h-80 place-items-center border border-dashed border-black/20 bg-white p-8 text-center">
                  <div>
                    <Store className="mx-auto size-10 text-black/30" />
                    <h2 className="mt-4 text-2xl font-black uppercase">
                      Ainda não existem encomendas
                    </h2>
                    <p className="mt-2 text-black/55">
                      As encomendas criadas no checkout aparecerão aqui.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <article
                      key={order.reference}
                      className="bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--brand)]">
                            {order.reference}
                          </p>
                          <h2 className="mt-1 text-2xl font-black uppercase">
                            {order.customerName}
                          </h2>
                          <p className="text-sm text-black/55">
                            {order.customerEmail} · {order.customerPhone}
                          </p>
                        </div>
                        <strong className="text-2xl">
                          {(order.totalCents / 100)
                            .toFixed(2)
                            .replace(".", ",")}{" "}
                          €
                        </strong>
                      </div>
                      <div className="mt-5 grid gap-5 border-t border-black/10 pt-5 md:grid-cols-[1fr_1fr_190px]">
                        <div>
                          <p className="text-xs font-bold uppercase">Artigos</p>
                          <ul className="mt-2 space-y-1 text-sm">
                            {order.items.map((item, index) => (
                              <li key={`${item.slug}-${index}`}>
                                {item.quantity}× {item.name} · {item.size} ·{" "}
                                {item.color}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase">Entrega</p>
                          <p className="mt-2 text-sm">
                            {order.shippingAddress.address}
                            <br />
                            {order.shippingAddress.postalCode}{" "}
                            {order.shippingAddress.city}
                            <br />
                            {order.shippingAddress.country}
                          </p>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase">
                            Estado
                          </label>
                          <Select
                            value={order.status}
                            onValueChange={(status) =>
                              updateOrderStatus(order.reference, status)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="paid">Paga</SelectItem>
                              <SelectItem value="preparing">
                                Em preparação
                              </SelectItem>
                              <SelectItem value="shipped">Enviada</SelectItem>
                              <SelectItem value="cancelled">
                                Cancelada
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : section === "media" ? (
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">Conteúdos</p>
                  <h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">Biblioteca de media</h1>
                  <p className="mt-3 text-black/60">Carrega os PNG transparentes dos designs e utiliza-os nos produtos.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 bg-[var(--ink)] px-5 text-sm font-medium text-white">
                    <input type="file" accept="image/png,image/webp,image/jpeg" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file); event.target.value = ""; }} />
                    {uploading ? "A carregar…" : "Carregar imagem"}
                  </label>
                  <Button variant="outline" className="rounded-none" onClick={() => setSettings({ ...settings, media: [...settings.media, { url: "", alt: "" }] })}><Plus />Adicionar URL</Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {settings.media.map((item, index) => (
                  <article key={`${item.url}-${index}`} className="bg-white p-4">
                    <div className="relative mb-4 aspect-square overflow-hidden bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]">
                      {item.url ? <Image src={item.url} alt={item.alt || "Media"} fill sizes="(min-width: 1024px) 30vw, 50vw" unoptimized className="object-contain p-4" /> : <span className="grid h-full place-items-center text-sm text-black/40">Sem imagem</span>}
                    </div>
                    <div className="grid gap-2">
                      <Input value={item.url} onChange={(event) => setSettings({ ...settings, media: settings.media.map((entry, i) => i === index ? { ...entry, url: event.target.value } : entry) })} placeholder="https://..." />
                      <Input value={item.alt} onChange={(event) => setSettings({ ...settings, media: settings.media.map((entry, i) => i === index ? { ...entry, alt: event.target.value } : entry) })} placeholder="Nome do design" />
                      <Button variant="ghost" className="justify-start rounded-none text-red-600" onClick={() => setSettings({ ...settings, media: settings.media.filter((_, i) => i !== index) })}><Trash2 />Remover da biblioteca</Button>
                    </div>
                  </article>
                ))}
                {!settings.media.length && <div className="col-span-full border-2 border-dashed border-black/15 bg-white/50 p-12 text-center"><Images className="mx-auto size-10 text-black/30" /><p className="mt-4 font-bold">Ainda não há imagens.</p><p className="mt-1 text-sm text-black/50">Configura o Cloudinary no Render e carrega o primeiro PNG.</p></div>}
              </div>
            </div>
          ) : section === "settings" ? (
            <div className="mx-auto max-w-5xl">
              <div className="mb-8">
                <p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">
                  Sistema
                </p>
                <h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">
                  Definições
                </h1>
                <p className="mt-3 text-black/60">
                  Marca, SEO, contactos, páginas legais e biblioteca de media.
                </p>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="space-y-4 bg-white p-6">
                  <h2 className="text-2xl font-black uppercase">Marca e SEO</h2>
                  <Input
                    value={settings.brandName}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        brandName: event.target.value,
                      })
                    }
                    placeholder="Nome da marca"
                  />
                  <Input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        contactEmail: event.target.value,
                      })
                    }
                    placeholder="Email de contacto"
                  />
                  <Input
                    value={settings.announcement}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        announcement: event.target.value,
                      })
                    }
                    placeholder="Mensagem no topo da loja"
                  />
                  <Input
                    value={settings.seoTitle}
                    onChange={(event) =>
                      setSettings({ ...settings, seoTitle: event.target.value })
                    }
                    placeholder="Título SEO"
                  />
                  <textarea
                    value={settings.seoDescription}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        seoDescription: event.target.value,
                      })
                    }
                    className="min-h-24 w-full border border-input p-3"
                    placeholder="Descrição SEO"
                  />
                  <Input
                    value={settings.instagramUrl}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        instagramUrl: event.target.value,
                      })
                    }
                    placeholder="Instagram URL"
                  />
                  <Input
                    value={settings.facebookUrl}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        facebookUrl: event.target.value,
                      })
                    }
                    placeholder="Facebook URL"
                  />
                </section>
                <section className="space-y-4 bg-white p-6">
                  <h2 className="text-2xl font-black uppercase">
                    Páginas legais
                  </h2>
                  <label className="block text-xs font-bold uppercase">
                    Termos e condições
                  </label>
                  <textarea
                    value={settings.terms}
                    onChange={(event) =>
                      setSettings({ ...settings, terms: event.target.value })
                    }
                    className="min-h-32 w-full border border-input p-3"
                  />
                  <label className="block text-xs font-bold uppercase">
                    Privacidade
                  </label>
                  <textarea
                    value={settings.privacy}
                    onChange={(event) =>
                      setSettings({ ...settings, privacy: event.target.value })
                    }
                    className="min-h-32 w-full border border-input p-3"
                  />
                  <label className="block text-xs font-bold uppercase">
                    Trocas e devoluções
                  </label>
                  <textarea
                    value={settings.returns}
                    onChange={(event) =>
                      setSettings({ ...settings, returns: event.target.value })
                    }
                    className="min-h-32 w-full border border-input p-3"
                  />
                  <div className="flex flex-wrap gap-3 text-sm underline">
                    <Link href="/legal/terms" target="_blank">
                      Ver termos
                    </Link>
                    <Link href="/legal/privacy" target="_blank">
                      Ver privacidade
                    </Link>
                    <Link href="/legal/returns" target="_blank">
                      Ver devoluções
                    </Link>
                  </div>
                </section>
              </div>
              <section className="mt-5 bg-white p-6">
                <div>
                  <h2 className="text-2xl font-black uppercase">
                    Theme Builder
                  </h2>
                  <p className="mt-1 text-sm text-black/50">
                    Define as cores globais aplicadas à loja e às páginas.
                  </p>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ["brandColor", "Cor da marca"],
                      ["accentColor", "Cor de destaque"],
                      ["darkColor", "Texto e fundos escuros"],
                      ["backgroundColor", "Fundo da loja"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="space-y-2 text-xs font-bold uppercase">
                      <span>{label}</span>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.theme[key]}
                          onChange={(event) =>
                            setSettings({
                              ...settings,
                              theme: {
                                ...settings.theme,
                                [key]: event.target.value,
                              },
                            })
                          }
                          className="h-10 w-12 cursor-pointer border border-input bg-white p-1"
                        />
                        <Input
                          value={settings.theme[key]}
                          onChange={(event) =>
                            setSettings({
                              ...settings,
                              theme: {
                                ...settings.theme,
                                [key]: event.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </label>
                  ))}
                </div>
                <div
                  className="mt-5 flex min-h-24 items-center justify-center p-6 text-center font-black uppercase"
                  style={{
                    background: settings.theme.backgroundColor,
                    color: settings.theme.darkColor,
                    borderLeft: `12px solid ${settings.theme.brandColor}`,
                  }}
                >
                  <span style={{ background: settings.theme.accentColor }} className="px-5 py-3">
                    Pré-visualização da identidade
                  </span>
                </div>
              </section>
              <section className="mt-5 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black uppercase">
                      Biblioteca de media
                    </h2>
                    <p className="mt-1 text-sm text-black/50">
                      Faz upload para Cloudinary ou adiciona um URL externo.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex h-9 cursor-pointer items-center gap-2 bg-[var(--ink)] px-4 text-sm font-medium text-white">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadMedia(file);
                          event.target.value = "";
                        }}
                      />
                      {uploading ? "A carregar…" : "Carregar imagem"}
                    </label>
                    <Button
                      variant="outline"
                      className="rounded-none"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          media: [...settings.media, { url: "", alt: "" }],
                        })
                      }
                    >
                      <Plus />
                      Adicionar URL
                    </Button>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {settings.media.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-2 md:grid-cols-[1fr_1fr_44px]"
                    >
                      <Input
                        value={item.url}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            media: settings.media.map((entry, i) =>
                              i === index
                                ? { ...entry, url: event.target.value }
                                : entry,
                            ),
                          })
                        }
                        placeholder="https://..."
                      />
                      <Input
                        value={item.alt}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            media: settings.media.map((entry, i) =>
                              i === index
                                ? { ...entry, alt: event.target.value }
                                : entry,
                            ),
                          })
                        }
                        placeholder="Descrição da imagem"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            media: settings.media.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <Trash2 className="text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">
                    Loja
                  </p>
                  <h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">
                    Catálogo
                  </h1>
                  <p className="mt-3 text-black/60">
                    Produtos publicados aparecem automaticamente na montra.
                  </p>
                </div>
                <Button
                  onClick={() =>
                    setCatalogue((items) => [
                      ...items,
                      {
                        id: Date.now(),
                        slug: "novo-produto",
                        name: "Novo produto",
                        description: "",
                        priceCents: 2000,
                        collection: "Made in Maia",
                        imageKey: "",
                        colors: ["Branco"],
                        sizes: ["S", "M", "L"],
                        variants: [],
                        status: "draft",
                      },
                    ])
                  }
                  className="rounded-none bg-[var(--ink)] text-white"
                >
                  <Plus />
                  Novo produto
                </Button>
              </div>
              <div className="space-y-4">
                {catalogue.map((product) => (
                  <article key={product.id} className="bg-white p-5 shadow-sm">
                    <div className="grid gap-5 lg:grid-cols-[1fr_180px]">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase">
                            Nome
                          </label>
                          <Input
                            value={product.name}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                name: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase">
                            Slug
                          </label>
                          <Input
                            value={product.slug}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                slug: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase">
                            Coleção
                          </label>
                          <Input
                            value={product.collection}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                collection: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase">
                            Preço (€)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={(product.priceCents / 100).toFixed(2)}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                priceCents: Math.round(
                                  Number(event.target.value) * 100,
                                ),
                              })
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-bold uppercase">
                            Imagem
                          </label>
                          <Input
                            value={product.imageKey}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                imageKey: event.target.value,
                              })
                            }
                            placeholder="PNG transparente da biblioteca"
                          />
                          {settings.media.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                              {settings.media.filter((item) => item.url).map((item, mediaIndex) => (
                                <button
                                  key={`${item.url}-${mediaIndex}`}
                                  type="button"
                                  onClick={() => updateProduct(product.id, { imageKey: item.url })}
                                  title={item.alt || "Usar imagem"}
                                  className={`relative size-20 shrink-0 overflow-hidden border-2 bg-white ${product.imageKey === item.url ? "border-[var(--brand)]" : "border-black/10"}`}
                                >
                                  <Image src={item.url} alt={item.alt || "Design"} fill sizes="80px" unoptimized className="object-contain p-2" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase">
                            Cores, separadas por vírgula
                          </label>
                          <Input
                            value={product.colors.join(", ")}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                colors: event.target.value
                                  .split(",")
                                  .map((v) => v.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                          <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto border border-black/10 p-3">
                            {PRODUCT_COLORS.map((entry) => {
                              const active = product.colors.includes(entry.name);
                              return (
                                <button
                                  key={entry.name}
                                  type="button"
                                  onClick={() => updateProduct(product.id, {
                                    colors: active
                                      ? product.colors.filter((color) => color !== entry.name)
                                      : [...product.colors, entry.name],
                                  })}
                                  className={`flex items-center gap-2 border px-2 py-1.5 text-xs font-bold ${active ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-black/15 bg-white"}`}
                                >
                                  <span className="size-4 rounded-full border border-black/15" style={{ backgroundColor: entry.hex }} />
                                  {entry.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase">
                            Tamanhos, separados por vírgula
                          </label>
                          <Input
                            value={product.sizes.join(", ")}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                sizes: event.target.value
                                  .split(",")
                                  .map((v) => v.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col justify-between gap-4 border-l border-black/10 pl-5">
                        <div>
                          <p className="text-xs font-bold uppercase">Estado</p>
                          <div className="mt-3 flex items-center gap-2">
                            <Switch
                              checked={product.status === "published"}
                              onCheckedChange={(checked) =>
                                updateProduct(product.id, {
                                  status: checked ? "published" : "draft",
                                })
                              }
                            />
                            <span className="text-sm">
                              {product.status === "published"
                                ? "Publicado"
                                : "Rascunho"}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="rounded-none"
                          asChild
                        >
                          <Link href="/" target="_blank">
                            <Eye />
                            Ver loja
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-5 border-t border-black/10 pt-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase">
                            Stock por variante
                          </p>
                          <p className="mt-1 text-sm text-black/50">
                            {product.variants?.reduce(
                              (sum, variant) => sum + variant.stock,
                              0,
                            ) ?? 0}{" "}
                            unidades em stock
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-none"
                          onClick={() => {
                            const existing = new Map(
                              (product.variants ?? []).map((variant) => [
                                `${variant.type}:${variant.color}:${variant.size}`,
                                variant,
                              ]),
                            );
                            updateProduct(product.id, {
                              variants: product.colors.flatMap((color) =>
                                PRODUCT_TYPES.flatMap((productType) =>
                                  productType.sizes.map(
                                    (size) =>
                                      existing.get(`${productType.key}:${color}:${size}`) ?? {
                                        sku: `${product.slug}-${productType.key}-${color}-${size}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
                                        type: productType.key,
                                        color,
                                        size,
                                        stock: 0,
                                        active: false,
                                      },
                                  ),
                                ),
                              ),
                            });
                          }}
                        >
                          Preparar variantes
                        </Button>
                      </div>
                      {product.variants?.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {product.colors.map((color) => (
                            <details key={color} className="border border-black/10 bg-[#f5f5f2] p-4" open={product.colors.length === 1}>
                              <summary className="cursor-pointer font-black uppercase">{color}</summary>
                              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                                {PRODUCT_TYPES.map((productType) => (
                                  <div key={productType.key} className="bg-white p-3">
                                    <p className="text-sm font-black">{productType.label}</p>
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                      {productType.sizes.map((size) => {
                                        const index = product.variants.findIndex((variant) => variant.type === productType.key && variant.color === color && variant.size === size);
                                        const active = index >= 0 && product.variants[index].active;
                                        return <button key={size} type="button" onClick={() => index >= 0 && updateProduct(product.id, { variants: product.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, active: !active } : variant) })} className={`border px-2 py-2 text-xs font-black ${active ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-black/10 text-black/35"}`}>{size}</button>;
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          ))}
                          <p className="text-xs font-bold uppercase text-black/50">Stock das variantes ativas</p>
                          {product.variants.map((variant, variantIndex) => variant.active && (
                            <div
                              key={`${variant.type}-${variant.color}-${variant.size}`}
                              className="grid gap-2 bg-[#f5f5f2] p-2 md:grid-cols-[1fr_150px_110px_70px_100px] md:items-center"
                            >
                              <Input
                                value={variant.sku}
                                aria-label="SKU"
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    variants: product.variants.map(
                                      (item, index) =>
                                        index === variantIndex
                                          ? { ...item, sku: event.target.value }
                                          : item,
                                    ),
                                  })
                                }
                              />
                              <span className="text-sm font-semibold">
                                {PRODUCT_TYPES.find((type) => type.key === variant.type)?.label ?? variant.type}
                              </span>
                              <span className="text-sm font-semibold">
                                {variant.color}
                              </span>
                              <span className="text-sm font-semibold">
                                {variant.size}
                              </span>
                              <Input
                                type="number"
                                min="0"
                                value={variant.stock}
                                aria-label={`Stock ${variant.color} ${variant.size}`}
                                onChange={(event) =>
                                  updateProduct(product.id, {
                                    variants: product.variants.map(
                                      (item, index) =>
                                        index === variantIndex
                                          ? {
                                              ...item,
                                              stock: Math.max(
                                                0,
                                                Number(event.target.value) || 0,
                                              ),
                                            }
                                          : item,
                                    ),
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
        {section === "pages" ? (
          <aside className="border-l border-black/10 bg-white p-5 max-lg:hidden">
            <Tabs defaultValue="content">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="style">Estilo</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="space-y-5 pt-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Tipo de bloco
                  </label>
                  <Select
                    value={current?.type}
                    onValueChange={(value) => updateBlock({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hero">Hero</SelectItem>
                      <SelectItem value="Produtos">Produtos</SelectItem>
                      <SelectItem value="Banner">Banner</SelectItem>
                      <SelectItem value="Texto">Texto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Título
                  </label>
                  <Input
                    value={current?.title ?? ""}
                    onChange={(event) =>
                      updateBlock({ title: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Descrição
                  </label>
                  <textarea
                    value={current?.description ?? ""}
                    onChange={(event) =>
                      updateBlock({ description: event.target.value })
                    }
                    className="min-h-28 w-full border border-input p-3 outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button
                  onClick={addBlock}
                  variant="outline"
                  className="w-full rounded-none"
                >
                  <Plus />
                  Adicionar bloco
                </Button>
                <Button
                  onClick={() =>
                    setBlocks((items) =>
                      items.filter((item) => item.id !== selected),
                    )
                  }
                  variant="ghost"
                  className="w-full rounded-none text-red-600"
                >
                  <Trash2 />
                  Remover bloco
                </Button>
              </TabsContent>
              <TabsContent value="style" className="space-y-5 pt-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Fundo
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["#ff4f1f", "#d9ff43", "#171713", "#ffffff"].map(
                      (color) => (
                        <button
                          key={color}
                          className="aspect-square border"
                          style={{ backgroundColor: color }}
                          aria-label={`Cor ${color}`}
                        />
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Largura
                  </label>
                  <Select defaultValue="full">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Largura total</SelectItem>
                      <SelectItem value="content">Conteúdo</SelectItem>
                      <SelectItem value="narrow">Estreita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-8 border-t pt-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <GripVertical className="size-4" />
                Estrutura da página
              </p>
              <ol className="mt-3 space-y-2">
                {blocks.map((block) => (
                  <li key={block.id}>
                    <button
                      onClick={() => setSelected(block.id)}
                      className={`w-full px-3 py-2 text-left text-sm ${selected === block.id ? "bg-[#fff0ea] text-[#d33b10]" : "bg-[#f5f5f2]"}`}
                    >
                      {block.type} · {block.title}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        ) : (
          <aside className="border-l border-black/10 bg-[var(--accent-brand)] p-5 max-lg:hidden">
            <p className="text-sm font-black uppercase tracking-[.15em]">
              {section === "orders" ? "Operação" : "Publicação"}
            </p>
            <h2 className="mt-5 text-3xl font-black uppercase tracking-[-.04em]">
              {section === "orders"
                ? "Acompanha cada encomenda até à entrega."
                : "Guardar torna as alterações imediatamente disponíveis."}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-black/65">
              {section === "discover"
                ? "O QR permanece sempre igual. Ativa, desativa ou altera as surpresas sem reimprimir qualquer peça."
                : section === "orders"
                  ? "A mudança de estado é guardada no momento da seleção. Liga o pagamento para automatizar a passagem de pendente para paga."
                  : "Os produtos publicados aparecem na loja. Os rascunhos permanecem apenas no Studio."}
            </p>
          </aside>
        )}
      </div>
    </main>
  );
}
