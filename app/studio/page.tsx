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
  ShoppingBag,
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
import type { ProductVariant } from "@/lib/product-variants";
import { ADULT_SIZES, CATALOG_CATEGORIES, CATALOG_SIZES, DEFAULT_COLORS, DEFAULT_SUPPORTS, KIDS_SIZES, normalizeSupport, type CatalogColor, type ProductSupport } from "@/lib/product-catalog";
import { DEFAULT_PAGE_BLOCKS, withRequiredHomeBlocks, type PageBlock as Block, type PageBlockType } from "@/lib/page-blocks";
import { PageBlock } from "@/components/page-block";
import { ProductMockup } from "@/components/product-mockup";
import { DEFAULT_NAVIGATION, type NavigationItem } from "@/lib/site-navigation";

type Discovery = {
  id: number;
  title: string;
  type: string;
  body: string;
  category: string;
  tags: string[];
  mediaUrl: string;
  linkUrl: string;
  linkLabel: string;
  weight: number;
  active: boolean;
};
type Product = {
  id: number;
  slug: string;
  designCode: string;
  name: string;
  nameTranslations: Record<string, string>;
  description: string;
  priceCents: number;
  collection: string;
  tags: string[];
  imageKey: string;
  gallery: string[];
  disabledSupports: string[];
  colors: string[];
  sizes: string[];
  variants: ProductVariant[];
  status: "draft" | "published";
  detailsLoaded: boolean;
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
type StudioPage = {
  id?: number;
  slug: string;
  title: string;
  blocks: Block[];
  status: "draft" | "published";
};
type SiteSettings = {
  brandName: string;
  contactEmail: string;
  announcement: string;
  seoTitle: string;
  seoDescription: string;
  instagramUrl: string;
  facebookUrl: string;
  navigation: NavigationItem[];
  terms: string;
  privacy: string;
  returns: string;
  media: Array<{
    url: string;
    alt: string;
    kind: "artwork" | "lifestyle" | "base";
  }>;
  theme: {
    brandColor: string;
    accentColor: string;
    darkColor: string;
    backgroundColor: string;
  };
  productCatalog: { colors: CatalogColor[]; supports: ProductSupport[] };
};

const initialBlocks: Block[] = DEFAULT_PAGE_BLOCKS;

const initialDiscoveries: Discovery[] = [
  {
    id: 1,
    title: "Hoje encontraste a Maia.",
    type: "text",
    body: "Uma ideia local, feita para viajar contigo.",
    category: "Made in Maia",
    tags: ["local", "surpresa"],
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
    designCode: "MiM_0001",
    name: "Guardião Zen",
    nameTranslations: {},
    description: "",
    priceCents: 2000,
    collection: "Made in Maia",
    tags: ["Cats"],
    imageKey: "/products/white-shirt-1.jpg",
    gallery: [],
    disabledSupports: [],
    colors: ["Branco"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    variants: [],
    status: "published",
    detailsLoaded: true,
  },
  {
    id: 2,
    slug: "piramide-digital",
    designCode: "MiM_0002",
    name: "Pirâmide Digital",
    nameTranslations: {},
    description: "",
    priceCents: 2000,
    collection: "Pop Culture",
    tags: ["Quotes"],
    imageKey: "/products/red-shirt-1.jpg",
    gallery: [],
    disabledSupports: [],
    colors: ["Vermelho"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    variants: [],
    status: "published",
    detailsLoaded: true,
  },
  {
    id: 3,
    slug: "los-robots",
    designCode: "MiM_0003",
    name: "Los Robots",
    nameTranslations: {},
    description: "",
    priceCents: 2000,
    collection: "Música",
    tags: ["Jars"],
    imageKey: "/products/blue-shirt-1.jpg",
    gallery: [],
    disabledSupports: [],
    colors: ["Azul"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    variants: [],
    status: "published",
    detailsLoaded: true,
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
  navigation: DEFAULT_NAVIGATION,
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
  productCatalog: { colors: DEFAULT_COLORS, supports: DEFAULT_SUPPORTS },
};

export default function Studio() {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [pageList, setPageList] = useState<StudioPage[]>([
    { slug: "inicio", title: "Início", blocks: initialBlocks, status: "draft" },
  ]);
  const [currentPageSlug, setCurrentPageSlug] = useState("inicio");
  const [selected, setSelected] = useState(1);
  const [viewport, setViewport] = useState("desktop");
  const [published, setPublished] = useState(false);
  const [studioKey, setStudioKey] = useState("");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState<
    "pages" | "menus" | "products" | "discover" | "orders" | "catalog" | "media" | "settings"
  >("pages");
  const [discoveries, setDiscoveries] = useState(initialDiscoveries);
  const [catalogue, setCatalogue] = useState(initialProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentConfigured, setPaymentConfigured] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [uploading, setUploading] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [galleryUrlDrafts, setGalleryUrlDrafts] = useState<Record<number, string>>({});
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "artwork" | "lifestyle" | "base">("all");
  const [draggedColorId, setDraggedColorId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);
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
  function pageSnapshot(): StudioPage[] {
    return pageList.map((page) =>
      page.slug === currentPageSlug
        ? { ...page, blocks, status: published ? "published" : "draft" }
        : page,
    );
  }
  function selectPage(slug: string) {
    const nextPages = pageSnapshot();
    const page = nextPages.find((entry) => entry.slug === slug);
    if (!page) return;
    setPageList(nextPages);
    setCurrentPageSlug(slug);
    setBlocks(page.blocks);
    setSelected(page.blocks[0]?.id ?? 0);
    setPublished(page.status === "published");
  }
  function addPage() {
    const suffix = pageList.length + 1;
    const page: StudioPage = {
      slug: `nova-pagina-${suffix}`,
      title: "Nova página",
      blocks: [{
        id: Date.now(),
        type: "Hero",
        eyebrow: "Made in Maia",
        title: "Nova página",
        description: "Começa a construir esta página.",
        background: "var(--brand)",
        textColor: "#ffffff",
        width: "full",
        align: "left",
        spacing: "large",
      }],
      status: "draft",
    };
    setPageList([...pageSnapshot(), page]);
    setCurrentPageSlug(page.slug);
    setBlocks(page.blocks);
    setSelected(page.blocks[0].id);
    setPublished(false);
  }
  function updateCurrentPage(patch: Partial<Pick<StudioPage, "title" | "slug">>) {
    const oldSlug = currentPageSlug;
    const nextSlug = patch.slug ?? oldSlug;
    setPageList((items) => items.map((page) =>
      page.slug === oldSlug ? { ...page, ...patch, blocks } : page,
    ));
    if (nextSlug !== oldSlug) setCurrentPageSlug(nextSlug);
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
        background: "#ffffff",
        textColor: "var(--ink)",
        width: "content",
        align: "left",
        spacing: "normal",
      },
    ]);
    setSelected(id);
  }
  async function save() {
    if (section === "settings" || section === "catalog" || section === "menus") {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studio-key": studioKey,
        },
        body: JSON.stringify({ resource: "settings", entries: [settings] }),
      });
      if (response.ok) toast.success(section === "catalog" ? "Tipos e cores guardados" : section === "menus" ? "Menu guardado" : "Definições guardadas");
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
      const loadedProducts = catalogue.filter((product) => product.detailsLoaded);
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studio-key": studioKey,
        },
        body: JSON.stringify({ resource: "products", entries: loadedProducts }),
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
    const pagesToSave = pageSnapshot();
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-studio-key": studioKey,
      },
      body: JSON.stringify({
        resource: "pages",
        entries: pagesToSave,
      }),
    });
    if (response.ok) {
      setPageList(pagesToSave);
      toast.success(published ? "Página publicada" : "Rascunho guardado");
    }
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
      page?: { blocks?: Block[]; status?: string } | null;
      pages?: StudioPage[];
      randomContent?: Array<Partial<Discovery> & { id: number }>;
      products?: Array<Partial<Product> & { id: number }>;
      orders?: Order[];
      paymentConfigured?: boolean;
      settings?: SiteSettings | null;
    };
    if (data.pages?.length) {
      const normalizedPages = data.pages.map((page) => ({
        ...page,
        blocks: page.slug === "inicio" ? withRequiredHomeBlocks(page.blocks) : page.blocks,
        status: page.status === "published" ? "published" as const : "draft" as const,
      }));
      const home = normalizedPages.find((page) => page.slug === "inicio") ?? normalizedPages[0];
      setPageList(normalizedPages);
      setCurrentPageSlug(home.slug);
      setBlocks(home.blocks);
      setSelected(home.blocks[0]?.id ?? 0);
      setPublished(home.status === "published");
    } else if (data.page?.blocks?.length) {
      const homeBlocks = withRequiredHomeBlocks(data.page.blocks);
      setBlocks(homeBlocks);
      setPageList([{ slug: "inicio", title: "Início", blocks: homeBlocks, status: data.page.status === "published" ? "published" : "draft" }]);
      setSelected(homeBlocks[0].id);
      setPublished(data.page.status === "published");
    }
    if (data.randomContent?.length)
      setDiscoveries(
        data.randomContent.map((entry) => ({
          id: entry.id,
          title: entry.title ?? "",
          type: entry.type ?? "text",
          body: entry.body ?? "",
          category: entry.category ?? "Internet gem",
          tags: entry.tags ?? [],
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
          designCode: entry.designCode ?? "",
          name: entry.name ?? "",
          nameTranslations: entry.nameTranslations ?? {},
          description: entry.description ?? "",
          priceCents: entry.priceCents ?? 0,
          collection: entry.collection ?? "Made in Maia",
          tags: entry.tags ?? [],
          imageKey: entry.imageKey ?? "",
          gallery: entry.gallery ?? [],
          disabledSupports: entry.disabledSupports ?? [],
          colors: entry.colors ?? [],
          sizes: entry.sizes ?? [],
          variants: (entry.variants ?? []).map((variant) => ({
            ...variant,
            type: variant.type ?? "adult-tshirt",
            active: variant.active !== false,
          })),
          status: entry.status === "published" ? "published" : "draft",
          detailsLoaded: false,
        })),
      );
    setOrders(data.orders ?? []);
    setPaymentConfigured(Boolean(data.paymentConfigured));
    if (data.settings)
      setSettings({
        ...initialSettings,
        ...data.settings,
        theme: { ...initialSettings.theme, ...data.settings.theme },
        productCatalog: {
          colors: data.settings.productCatalog?.colors ?? DEFAULT_COLORS,
          supports: (data.settings.productCatalog?.supports ?? DEFAULT_SUPPORTS).filter((support) => support.id !== "sunglasses").map(normalizeSupport),
        },
        media: (data.settings.media ?? []).map((item) => ({
          ...item,
          kind: item.kind ?? "artwork",
        })),
        navigation: data.settings.navigation?.length ? data.settings.navigation : DEFAULT_NAVIGATION,
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
  async function openProduct(product: Product) {
    if (expandedProductId === product.id) {
      setExpandedProductId(null);
      return;
    }
    setExpandedProductId(product.id);
    if (product.detailsLoaded || product.id > 1_000_000_000_000) return;
    const response = await fetch(`/api/studio?productId=${product.id}`, {
      headers: { "x-studio-key": studioKey },
    });
    if (!response.ok) {
      toast.error("Não foi possível carregar o produto.");
      return;
    }
    const data = (await response.json()) as { product: Partial<Product> };
    setCatalogue((items) => items.map((item) => item.id === product.id ? {
      ...item,
      ...data.product,
      nameTranslations: data.product.nameTranslations ?? {},
      tags: data.product.tags ?? [],
      gallery: data.product.gallery ?? [],
      disabledSupports: data.product.disabledSupports ?? [],
      colors: data.product.colors ?? [],
      sizes: data.product.sizes ?? [],
      variants: data.product.variants ?? [],
      detailsLoaded: true,
    } : item));
  }
  async function updateProductStatus(product: Product, active: boolean) {
    const status = active ? "published" : "draft";
    updateProduct(product.id, { status });
    if (product.id > 1_000_000_000_000) return;
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: { "content-type": "application/json", "x-studio-key": studioKey },
      body: JSON.stringify({ resource: "product-status", productId: product.id, status }),
    });
    if (!response.ok) toast.error("Não foi possível alterar o estado do produto.");
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
          {
            url: data.url!,
            alt: file.name.replace(/\.[^.]+$/, ""),
            kind: file.type === "image/png" ? "artwork" : "lifestyle",
          },
        ],
      }));
      toast.success("Imagem carregada. Guarda a biblioteca para confirmar.");
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
            ? `Página: ${pageList.find((page) => page.slug === currentPageSlug)?.title ?? "Início"}`
            : section === "menus"
              ? "Navegação principal"
            : section === "discover"
              ? "Conteúdo: Descobre"
              : section === "orders"
                ? "Encomendas"
                : section === "catalog"
                  ? "Tipos e cores"
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
              { icon: GripVertical, label: "Menus", value: "menus" },
              { icon: Palette, label: "Descobre", value: "discover" },
              { icon: Package, label: "Produtos", value: "products" },
              { icon: Store, label: "Tipos e cores", value: "catalog" },
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
              <div className="mb-4 flex flex-wrap items-center gap-2 bg-white p-3 shadow-sm">
                <label className="text-xs font-black uppercase tracking-[.12em]">Página</label>
                <Select value={currentPageSlug} onValueChange={selectPage}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {pageList.map((page) => <SelectItem key={page.slug} value={page.slug}>{page.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" className="rounded-none" onClick={addPage}><Plus />Nova página</Button>
                <Button type="button" variant="ghost" className="ml-auto rounded-none" asChild>
                  <Link href={currentPageSlug === "inicio" ? "/loja" : `/${currentPageSlug}`} target="_blank"><Eye />Abrir página</Link>
                </Button>
              </div>
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
                <div className="bg-[var(--ink)] px-5 py-2 text-center text-sm font-medium tracking-wide text-white">
                  {settings.announcement}
                </div>
                <div className="flex h-[73px] items-center gap-5 border-b border-black/10 px-5 lg:px-10">
                  <span className="flex items-center gap-2">
                    <span className="grid size-10 rotate-3 place-items-center bg-[var(--brand)] text-xl font-black text-white">M</span>
                    <strong className="text-xl uppercase tracking-[-.055em]">{settings.brandName}</strong>
                  </span>
                  <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold lg:flex">
                    {settings.navigation.filter((item) => item.visible).map((item) => <span key={item.id}>{item.label}</span>)}
                  </nav>
                  <span className="grid size-10 place-items-center"><ShoppingBag className="size-5" /></span>
                </div>
                <div>
                  {blocks.map((block, index) => (
                    <div key={block.id} className="group relative">
                      <PageBlock block={block} editor selected={selected === block.id} onSelect={() => setSelected(block.id)}>
                        {block.type === "Produtos" ? <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{catalogue.filter((product) => product.status === "published").slice(0, 6).map((product) => <article key={product.id} className="text-[var(--ink)]"><div className="relative aspect-[4/5] overflow-hidden bg-white"><ProductMockup artwork={product.imageKey || "/products/white-shirt-1.jpg"} color={product.colors[0] ?? "White"} name={product.name} /><span className="absolute left-4 top-4 bg-[var(--accent-brand)] px-3 py-1 text-xs font-black uppercase">New</span></div><div className="flex items-start justify-between gap-4 pt-4"><div><p className="text-sm opacity-55">{product.tags.join(" · ") || product.collection}</p><h3 className="text-xl font-black uppercase tracking-[-.025em]">{product.name}</h3></div><strong className="text-lg">{(product.priceCents / 100).toFixed(2).replace(".", ",")} €</strong></div></article>)}</div> : block.type === "Coleções" ? <div className="grid gap-3 sm:grid-cols-3">{["Cats", "Quotes", "Jars"].map((tag) => <div key={tag} className="rounded-full border border-black/15 bg-white px-6 py-8 text-left text-2xl font-black uppercase">{tag}<span className="mt-2 block text-xs font-normal normal-case opacity-55">{catalogue.filter((product) => product.status === "published" && product.tags.includes(tag)).length} designs</span></div>)}</div> : undefined}
                      </PageBlock>
                      <span className="absolute right-4 top-4 inline-flex gap-1 opacity-0 group-hover:opacity-100">
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
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : section === "menus" ? (
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">Navegação</p>
                  <h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">Menu principal</h1>
                  <p className="mt-3 max-w-2xl text-black/60">Ordena os links, altera os nomes e esconde o que ainda não deve aparecer.</p>
                </div>
                <Button type="button" className="rounded-none bg-[var(--ink)] text-white" onClick={() => setSettings({ ...settings, navigation: [...settings.navigation, { id: crypto.randomUUID(), label: "Novo link", url: "/", visible: true }] })}><Plus />Adicionar link</Button>
              </div>
              <ol className="space-y-3">
                {settings.navigation.map((item, index) => (
                  <li key={item.id} className="grid items-center gap-3 border border-black/10 bg-white p-4 shadow-sm md:grid-cols-[32px_1fr_1fr_auto]">
                    <GripVertical className="text-black/30" />
                    <Input aria-label="Nome do link" value={item.label} onChange={(event) => setSettings({ ...settings, navigation: settings.navigation.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry) })} />
                    <Input aria-label="Destino do link" value={item.url} onChange={(event) => setSettings({ ...settings, navigation: settings.navigation.map((entry) => entry.id === item.id ? { ...entry, url: event.target.value } : entry) })} />
                    <div className="flex items-center gap-1">
                      <Switch checked={item.visible} onCheckedChange={(visible) => setSettings({ ...settings, navigation: settings.navigation.map((entry) => entry.id === item.id ? { ...entry, visible } : entry) })} />
                      <Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => { const next = [...settings.navigation]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setSettings({ ...settings, navigation: next }); }}><ArrowUp /></Button>
                      <Button type="button" size="icon" variant="ghost" disabled={index === settings.navigation.length - 1} onClick={() => { const next = [...settings.navigation]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; setSettings({ ...settings, navigation: next }); }}><ArrowDown /></Button>
                      <Button type="button" size="icon" variant="ghost" className="text-red-600" onClick={() => setSettings({ ...settings, navigation: settings.navigation.filter((entry) => entry.id !== item.id) })}><Trash2 /></Button>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-8 border border-black/10 bg-[var(--ink)] p-5 text-white">
                <p className="mb-4 text-xs font-black uppercase tracking-[.15em] text-white/50">Pré-visualização</p>
                <nav className="flex flex-wrap gap-5 text-sm font-bold">{settings.navigation.filter((item) => item.visible).map((item) => <span key={item.id}>{item.label}</span>)}</nav>
              </div>
            </div>
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
                    <div className="mb-4 grid gap-3 md:grid-cols-3">
                      <label className="grid gap-1 text-xs font-bold uppercase">Formato
                        <Select value={entry.type} onValueChange={(type) => updateDiscovery(entry.id, { type })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="article">Artigo / long page</SelectItem>
                            <SelectItem value="meme">Meme</SelectItem>
                            <SelectItem value="image">Imagem</SelectItem>
                            <SelectItem value="gif">GIF</SelectItem>
                            <SelectItem value="video">Vídeo</SelectItem>
                            <SelectItem value="youtube">YouTube embed</SelectItem>
                            <SelectItem value="link">Link recomendado</SelectItem>
                            <SelectItem value="text">Texto curto</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="grid gap-1 text-xs font-bold uppercase">Categoria / trigger
                        <Input value={entry.category} onChange={(event) => updateDiscovery(entry.id, { category: event.target.value })} placeholder="Internet gem" />
                      </label>
                      <label className="grid gap-1 text-xs font-bold uppercase">Tags
                        <Input value={entry.tags.join(", ")} onChange={(event) => updateDiscovery(entry.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="internet, nostalgia, funny" />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase">
                          Conteúdo do artigo / mensagem
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
                        <p className="mt-1 text-xs text-black/40">Aceita vários parágrafos; no frontend será apresentado como conteúdo editorial.</p>
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase">Media / embed URL</label>
                          <Input value={entry.mediaUrl} onChange={(event) => updateDiscovery(entry.id, { mediaUrl: event.target.value })} placeholder="Imagem, GIF, MP4 ou URL do YouTube" />
                        </div>
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
                      category: "Internet gem",
                      tags: [],
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
          ) : section === "catalog" ? (
            <div className="mx-auto max-w-6xl space-y-6">
              <div><p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">Catálogo base</p><h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">Tipos e cores</h1><p className="mt-3 text-black/60">Estas opções são reutilizadas por todos os designs da loja.</p></div>
              <section className="bg-white p-6">
                <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-black uppercase">Gestor de cores</h2><p className="mt-1 text-sm text-black/50">Desativa cores sazonais sem apagar produtos.</p></div><Button variant="outline" className="rounded-none" onClick={() => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors: [...settings.productCatalog.colors, { id: `cor-${Date.now()}`, name: "Nova cor", hex: "#cccccc", active: true }] } })}><Plus />Nova cor</Button></div>
                <div className="mt-5 max-w-2xl space-y-2">
                  {settings.productCatalog.colors.map((color, index) => <div key={color.id} draggable onDragStart={() => setDraggedColorId(color.id)} onDragEnd={() => setDraggedColorId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!draggedColorId || draggedColorId === color.id) return; const colors = [...settings.productCatalog.colors]; const from = colors.findIndex((item) => item.id === draggedColorId); const [moved] = colors.splice(from, 1); colors.splice(index, 0, moved); setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors } }); setDraggedColorId(null); }} className={`grid cursor-grab grid-cols-[28px_42px_1fr_44px] items-center gap-2 rounded-full border px-3 py-2 ${draggedColorId === color.id ? "border-[var(--brand)] opacity-50" : "border-black/10"}`}><GripVertical className="size-4 text-black/35" /><input type="color" value={color.hex} onChange={(event) => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors: settings.productCatalog.colors.map((item, i) => i === index ? { ...item, hex: event.target.value } : item) } })} className="h-9 w-9 rounded-full" /><Input value={color.name} onChange={(event) => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors: settings.productCatalog.colors.map((item, i) => i === index ? { ...item, name: event.target.value } : item) } })} className="rounded-full border-0 bg-transparent shadow-none" /><Switch checked={color.active} onCheckedChange={(active) => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors: settings.productCatalog.colors.map((item, i) => i === index ? { ...item, active } : item) } })} /></div>)}
                </div>
              </section>
              <section className="bg-white p-6">
                <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-black uppercase">Tipos de produto</h2><p className="mt-1 text-sm text-black/50">Cada categoria mostra apenas as opções que fazem sentido.</p></div><Button variant="outline" className="rounded-none" onClick={() => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, supports: [...settings.productCatalog.supports, normalizeSupport({ id: `suporte-${Date.now()}`, name: "Novo suporte", categoryId: "apparel", variantMode: "size", colorIds: [] })] } })}><Plus />Novo tipo</Button></div>
                <div className="mt-6 space-y-8">{CATALOG_CATEGORIES.map((category) => <div key={category.id}><h3 className="mb-3 text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">{category.name}</h3><div className="space-y-3">{settings.productCatalog.supports.map(normalizeSupport).map((support, supportIndex) => ({ support, supportIndex })).filter(({ support }) => support.categoryId === category.id).map(({ support, supportIndex }) => {
                  const updateSupport = (patch: Partial<ProductSupport>) => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, supports: settings.productCatalog.supports.map((item, i) => i === supportIndex ? normalizeSupport({ ...support, ...patch }) : item) } });
                  const activeColors = settings.productCatalog.colors.filter((color) => color.active);
                  const optionPool = support.variantMode === "size" ? CATALOG_SIZES.filter((item) => item !== "Único") : [];
                  const setAllColors = (enabled:boolean) => updateSupport({ colorIds: enabled ? activeColors.map((color) => color.id) : [], availability: enabled ? Object.fromEntries(activeColors.map((color) => [color.id, [...optionPool]])) : {} });
                  return <details key={support.id} className="rounded-3xl border border-black/10 p-5" open><summary className="cursor-pointer text-xl font-black uppercase">{support.name}</summary><div className="mt-5 grid gap-6">
                    <div className="grid gap-3 md:grid-cols-[1fr_190px_120px]"><Input value={support.name} onChange={(event) => updateSupport({ name: event.target.value })} /><Select value={support.categoryId} onValueChange={(value) => updateSupport({ categoryId:value as ProductSupport["categoryId"], variantMode:value === "bags" ? "none" : "size", sizes:value === "bags" ? [] : CATALOG_SIZES.filter((item)=>item!=="Único") })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATALOG_CATEGORIES.map((item)=><SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select><label className="flex items-center gap-2 text-sm font-bold"><Switch checked={support.active} onCheckedChange={(active) => updateSupport({ active })} />Ativo</label></div>
                    <div className="grid gap-4 rounded-2xl bg-[#f5f5f2] p-4 md:grid-cols-[1fr_180px]">
                      <div><p className="text-xs font-black uppercase">Template único para todas as cores</p><p className="mt-1 text-sm text-black/50">PNG branco/cinza com fundo transparente. A loja aplica a cor sem carregar outra fotografia.</p><Input className="mt-3" value={support.templateImage} onChange={(event) => updateSupport({ templateImage: event.target.value })} placeholder="/mockup-templates/tshirt-neutral-v1.png" />{settings.media.some((item) => item.kind === "base" && item.url) && <div className="mt-2 flex flex-wrap gap-2">{settings.media.filter((item) => item.kind === "base" && item.url).map((item) => <Button key={item.url} type="button" size="sm" variant="outline" onClick={() => updateSupport({ templateImage: item.url })}>{item.alt || "Usar template"}</Button>)}</div>}</div>
                      <div className="relative aspect-square overflow-hidden bg-white">{support.templateImage ? <Image src={support.templateImage} alt="Template neutro" fill sizes="180px" unoptimized className="object-contain p-3" /> : <span className="grid h-full place-items-center p-4 text-center text-xs font-bold text-black/35">Sem template — será usado o mockup SVG</span>}</div>
                    </div>
                    {support.variantMode === "none" ? <p className="rounded-2xl bg-[#f5f5f2] p-4 text-sm font-bold">Sem tamanho — o cliente escolhe apenas a cor.</p> : <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black uppercase">Tamanhos base</p><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => updateSupport({ sizes:[...optionPool], availability:Object.fromEntries(support.colorIds.map((id)=>[id,[...optionPool]])) })}>Selecionar tudo</Button><Button type="button" size="sm" variant="ghost" onClick={() => updateSupport({ sizes:[], availability:Object.fromEntries(support.colorIds.map((id)=>[id,[]])) })}>Limpar tudo</Button></div></div><div className="grid gap-3 sm:grid-cols-2">{[{label:"Kids",values:KIDS_SIZES},{label:"Adults",values:ADULT_SIZES}].map((group)=><div key={group.label} className="rounded-2xl border border-black/10 p-4"><p className="mb-3 text-xs font-black uppercase">{group.label}</p><div className="flex flex-wrap gap-2">{group.values.map((option)=>{const enabled=support.sizes.includes(option);return <button key={option} type="button" onClick={()=>updateSupport({sizes:enabled?support.sizes.filter((item)=>item!==option):[...support.sizes,option]})} className={`rounded-full border px-4 py-2 text-sm font-black ${enabled?"border-[var(--brand)] bg-[var(--brand)] text-white":"border-black/15"}`}>{option}</button>})}</div></div>)}</div></div>}
                    <div><div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-black uppercase">Cores e disponibilidade</p><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={()=>setAllColors(true)}>Selecionar tudo</Button><Button type="button" size="sm" variant="ghost" onClick={()=>setAllColors(false)}>Limpar tudo</Button></div></div><div className="space-y-2">{activeColors.map((color) => { const enabled=support.colorIds.includes(color.id); const availableOptions=support.availability[color.id] ?? []; return <details key={color.id} className={`overflow-hidden rounded-2xl border ${enabled ? "border-black/20" : "border-black/10 opacity-60"}`}><summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden"><span onClick={(event)=>event.stopPropagation()}><Switch checked={enabled} onCheckedChange={(checked)=>updateSupport({ colorIds:checked ? [...support.colorIds,color.id] : support.colorIds.filter((id)=>id!==color.id), availability:{...support.availability,[color.id]:checked?[...support.sizes]:[]} })}/></span><span className="size-5 rounded-full border border-black/10" style={{backgroundColor:color.hex}}/><strong className="flex-1 text-sm">{color.name}</strong></summary><div className="border-t border-black/10 px-3 pb-3 pt-3 pl-12">{!enabled ? <p className="text-xs font-bold text-black/45">Ativa esta cor para gerir a disponibilidade.</p> : support.variantMode === "none" ? <p className="text-xs font-bold text-black/45">Este suporte não tem tamanhos.</p> : <div className="flex flex-wrap gap-2">{support.sizes.map((option)=>{const selected=availableOptions.includes(option);return <button key={option} type="button" onClick={()=>updateSupport({availability:{...support.availability,[color.id]:selected?availableOptions.filter((item)=>item!==option):[...availableOptions,option]}})} className={`rounded-full border px-3 py-1 text-xs font-bold ${selected?"border-[var(--ink)] bg-[var(--ink)] text-white":"border-black/15"}`}>{option}</button>})}</div>}</div></details>})}</div><details className="mt-4 text-sm"><summary className="cursor-pointer font-bold text-black/45">Mockups individuais antigos (fallback)</summary><div className="mt-3 grid gap-2">{activeColors.filter((color)=>support.colorIds.includes(color.id)).map((color)=><label key={color.id} className="grid grid-cols-[120px_1fr] items-center gap-2"><span>{color.name}</span><Input value={support.mockups[color.id]??""} onChange={(event)=>updateSupport({mockups:{...support.mockups,[color.id]:event.target.value}})} placeholder="Foto específica opcional"/></label>)}</div></details></div>
                  </div></details>;
                })}</div></div>)}</div>
              </section>
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
                    <input type="file" multiple accept="image/png,image/webp,image/jpeg" className="sr-only" disabled={uploading} onChange={(event) => { const files = Array.from(event.target.files ?? []); if (files.length) void Promise.all(files.map(uploadMedia)); event.target.value = ""; }} />
                    {uploading ? "A carregar…" : "Carregar imagens"}
                  </label>
                  <Button variant="outline" className="rounded-none" onClick={() => setSettings({ ...settings, media: [...settings.media, { url: "", alt: "", kind: "artwork" }] })}><Plus />Adicionar URL</Button>
                </div>
              </div>
              <div className="mb-5 grid gap-3 bg-white p-4 md:grid-cols-[1fr_auto]">
                <Input value={mediaQuery} onChange={(event) => setMediaQuery(event.target.value)} placeholder="Pesquisar por nome ou URL…" />
                <div className="flex flex-wrap gap-2">
                  {(["all", "artwork", "lifestyle", "base"] as const).map((filter) => <Button key={filter} type="button" size="sm" variant={mediaFilter === filter ? "default" : "outline"} onClick={() => setMediaFilter(filter)}>{filter === "all" ? "Tudo" : filter === "artwork" ? "Designs" : filter === "lifestyle" ? "Moda" : "Peças base"}</Button>)}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {settings.media.map((item, index) => ({ item, index })).filter(({ item }) => {
                  const query = mediaQuery.trim().toLowerCase();
                  return (mediaFilter === "all" || item.kind === mediaFilter) && (!query || `${item.alt} ${item.url}`.toLowerCase().includes(query));
                }).map(({ item, index }) => (
                  <article key={`${item.url}-${index}`} className="bg-white p-4">
                    <div className="relative mb-4 aspect-square overflow-hidden bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]">
                      {item.url ? <Image src={item.url} alt={item.alt || "Media"} fill sizes="(min-width: 1024px) 30vw, 50vw" unoptimized className="object-contain p-4" /> : <span className="grid h-full place-items-center text-sm text-black/40">Sem imagem</span>}
                    </div>
                    <div className="grid gap-2">
                      <Input value={item.url} onChange={(event) => setSettings({ ...settings, media: settings.media.map((entry, i) => i === index ? { ...entry, url: event.target.value } : entry) })} placeholder="https://..." />
                      <Input value={item.alt} onChange={(event) => setSettings({ ...settings, media: settings.media.map((entry, i) => i === index ? { ...entry, alt: event.target.value } : entry) })} placeholder="Nome do design" />
                      <Select value={item.kind ?? "artwork"} onValueChange={(kind) => setSettings({ ...settings, media: settings.media.map((entry, i) => i === index ? { ...entry, kind: kind as "artwork" | "lifestyle" | "base" } : entry) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="artwork">Design transparente</SelectItem><SelectItem value="lifestyle">Fotografia de moda</SelectItem><SelectItem value="base">Peça sem design</SelectItem></SelectContent></Select>
                      <Button variant="ghost" className="justify-start rounded-none text-red-600" onClick={() => setSettings({ ...settings, media: settings.media.filter((_, i) => i !== index) })}><Trash2 />Remover da biblioteca</Button>
                    </div>
                  </article>
                ))}
                {!settings.media.length && <div className="col-span-full border-2 border-dashed border-black/15 bg-white/50 p-12 text-center"><Images className="mx-auto size-10 text-black/30" /><p className="mt-4 font-bold">Ainda não há imagens.</p><p className="mt-1 text-sm text-black/50">Carrega o primeiro PNG, JPG ou WebP para a biblioteca local.</p></div>}
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
                      Carrega para o servidor ou adiciona um URL externo.
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
                          media: [
                            ...settings.media,
                            { url: "", alt: "", kind: "artwork" },
                          ],
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
                  onClick={() => {
                    const id = Date.now();
                    setCatalogue((items) => [
                      {
                        id,
                        slug: "novo-produto",
                        designCode: `MiM_${String(items.length + 1).padStart(4, "0")}`,
                        name: "Novo produto",
                        nameTranslations: {},
                        description: "",
                        priceCents: 2000,
                        collection: "Made in Maia",
                        tags: [],
                        imageKey: "",
                        gallery: [],
                        disabledSupports: [],
                        colors: ["Branco"],
                        sizes: ["S", "M", "L"],
                        variants: [],
                        status: "draft",
                        detailsLoaded: true,
                      },
                      ...items,
                    ]);
                    setExpandedProductId(id);
                  }}
                  className="rounded-none bg-[var(--ink)] text-white"
                >
                  <Plus />
                  Novo produto
                </Button>
              </div>
              <div className="space-y-3">
                {catalogue.map((product) => {
                  const isOpen = expandedProductId === product.id;
                  return (
                    <article key={product.id} className="overflow-hidden border border-black/10 bg-white shadow-sm">
                      <div className="grid grid-cols-[72px_1fr_auto] items-center gap-4 p-3 sm:grid-cols-[72px_130px_1fr_auto]">
                        <button type="button" onClick={() => void openProduct(product)} className="relative size-16 overflow-hidden border border-black/10 bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:16px_16px]">
                          {product.imageKey ? <Image src={product.imageKey} alt="" fill sizes="64px" unoptimized className="object-contain p-1" /> : <Images className="absolute inset-0 m-auto size-5 text-black/25" />}
                        </button>
                        <span className="hidden font-mono text-sm font-black sm:block">{product.designCode || "MiM_0000"}</span>
                        <button type="button" onClick={() => void openProduct(product)} className="min-w-0 text-left">
                          <strong className="block truncate text-lg">{product.name}</strong>
                          <span className="text-xs text-black/45 sm:hidden">{product.designCode || "MiM_0000"}</span>
                        </button>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs font-bold uppercase"><Switch checked={product.status === "published"} onCheckedChange={(checked) => void updateProductStatus(product, checked)} /><span className="hidden sm:inline">{product.status === "published" ? "Ativo" : "Inativo"}</span></label>
                          <Button type="button" variant="ghost" size="icon" onClick={() => void openProduct(product)} aria-label={isOpen ? "Fechar produto" : "Abrir produto"}><span className={`text-xl transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span></Button>
                        </div>
                      </div>
                      {isOpen && product.detailsLoaded && (
                        <div className="border-t border-black/10 p-5">
                          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                            <div className="grid content-start gap-4 md:grid-cols-2">
                              <label className="grid gap-1 text-xs font-bold uppercase"><span>Número do design</span><Input value={product.designCode} onChange={(event) => updateProduct(product.id, { designCode: event.target.value })} onBlur={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(-4); updateProduct(product.id, { designCode: `MiM_${digits.padStart(4, "0")}` }); }} placeholder="MiM_0000" /></label>
                              <label className="grid gap-1 text-xs font-bold uppercase"><span>Nome</span><Input value={product.name} onChange={(event) => updateProduct(product.id, { name: event.target.value })} /></label>
                              <label className="grid gap-1 text-xs font-bold uppercase"><span>Slug</span><Input value={product.slug} onChange={(event) => updateProduct(product.id, { slug: event.target.value })} /></label>
                              <label className="grid gap-1 text-xs font-bold uppercase"><span>Preço (€)</span><Input type="number" min="0" step="0.01" value={(product.priceCents / 100).toFixed(2)} onChange={(event) => updateProduct(product.id, { priceCents: Math.round(Number(event.target.value) * 100) })} /></label>
                              <label className="grid gap-1 text-xs font-bold uppercase md:col-span-2"><span>Tags de pesquisa</span><Input value={product.tags.join(", ")} onChange={(event) => updateProduct(product.id, { tags: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} placeholder="Cats, Quotes, Jars" /></label>
                              <details className="rounded-2xl border border-black/10 p-4 md:col-span-2"><summary className="cursor-pointer text-xs font-black uppercase">Traduções do nome</summary><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["pt", "es", "de", "fr"].map((locale) => <label key={locale} className="grid gap-1 text-xs font-bold uppercase"><span>{locale}</span><Input value={product.nameTranslations[locale] ?? ""} onChange={(event) => updateProduct(product.id, { nameTranslations: { ...product.nameTranslations, [locale]: event.target.value } })} placeholder={product.name} /></label>)}</div></details>
                              <div className="md:col-span-2">
                                <p className="text-xs font-bold uppercase">Suportes disponíveis</p>
                                <p className="mt-1 text-sm text-black/50">Todos ficam ativos por defeito; desativa apenas as exceções.</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {settings.productCatalog.supports.filter((support) => support.active).map((support) => {
                                    const enabled = !product.disabledSupports.includes(support.id);
                                    return (
                                      <label key={support.id} className={`inline-flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${enabled ? "border-black/20 bg-[#f5f5f2]" : "border-black/10 bg-white text-black/45"}`}>
                                        <span>{support.name}</span>
                                        <Switch checked={enabled} onCheckedChange={(checked) => updateProduct(product.id, { disabledSupports: checked ? product.disabledSupports.filter((id) => id !== support.id) : [...product.disabledSupports, support.id] })} />
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-6">
                              <section><div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-bold uppercase">Imagem de capa</p><p className="text-xs text-black/45">PNG com fundo transparente</p></div>{product.imageKey && <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => updateProduct(product.id, { imageKey: "" })}><Trash2 />Remover</Button>}</div><div className="relative aspect-square overflow-hidden border-2 border-dashed border-black/15 bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:24px_24px]">{product.imageKey ? <Image src={product.imageKey} alt={product.name} fill sizes="360px" unoptimized className="object-contain p-5" /> : <span className="grid h-full place-items-center text-sm font-bold text-black/35">Seleciona um design</span>}</div><Input className="mt-2" value={product.imageKey} onChange={(event) => updateProduct(product.id, { imageKey: event.target.value })} placeholder="URL do PNG" />{settings.media.some((item) => item.url && item.kind === "artwork") && <div className="mt-2 flex gap-2 overflow-x-auto pb-2">{settings.media.filter((item) => item.url && item.kind === "artwork").map((item) => <button key={item.url} type="button" title={item.alt} onClick={() => updateProduct(product.id, { imageKey: item.url })} className={`relative size-16 shrink-0 overflow-hidden border-2 bg-white ${product.imageKey === item.url ? "border-[var(--brand)]" : "border-black/10"}`}><Image src={item.url} alt={item.alt || "Design"} fill sizes="64px" unoptimized className="object-contain p-1" /></button>)}</div>}</section>
                              <section><p className="text-xs font-bold uppercase">Outras fotografias</p><p className="mt-1 text-xs text-black/45">Moda, detalhes e contexto.</p>{product.gallery.length > 0 && <div className="mt-3 grid grid-cols-2 gap-2">{product.gallery.map((photo, index) => <div key={`${photo}-${index}`} className="group relative aspect-[4/3] overflow-hidden bg-[#eee]"><Image src={photo} alt="" fill sizes="180px" unoptimized className="object-cover" /><Button type="button" size="icon" variant="destructive" className="absolute right-2 top-2 size-8 opacity-90" onClick={() => updateProduct(product.id, { gallery: product.gallery.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="size-4" /></Button></div>)}</div>}<div className="mt-3 flex gap-2"><Input value={galleryUrlDrafts[product.id] ?? ""} onChange={(event) => setGalleryUrlDrafts((drafts) => ({ ...drafts, [product.id]: event.target.value }))} placeholder="URL de outra fotografia" /><Button type="button" variant="outline" onClick={() => { const url = (galleryUrlDrafts[product.id] ?? "").trim(); if (!url) return; updateProduct(product.id, { gallery: [...product.gallery, url] }); setGalleryUrlDrafts((drafts) => ({ ...drafts, [product.id]: "" })); }}><Plus /></Button></div>{settings.media.some((item) => item.kind === "lifestyle" && item.url) && <div className="mt-2 flex gap-2 overflow-x-auto">{settings.media.filter((item) => item.kind === "lifestyle" && item.url).map((item) => <button key={item.url} type="button" title={item.alt} onClick={() => !product.gallery.includes(item.url) && updateProduct(product.id, { gallery: [...product.gallery, item.url] })} className="relative size-16 shrink-0 overflow-hidden border border-black/10 bg-white"><Image src={item.url} alt={item.alt || "Fotografia"} fill sizes="64px" unoptimized className="object-cover" /></button>)}</div>}</section>
                              <Button variant="outline" className="w-full rounded-none" asChild><Link href={`/produto/${product.slug}`} target="_blank"><Eye />Ver produto</Link></Button>
                            </div>
                          </div>
                        </div>
                      )}
                      {isOpen && !product.detailsLoaded && <div className="border-t border-black/10 p-8 text-center text-sm font-bold text-black/45">A carregar produto…</div>}
                    </article>
                  );
                })}
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
                <div className="border-b border-black/10 pb-5">
                  <p className="mb-3 text-xs font-black uppercase tracking-[.12em]">Definições da página</p>
                  <label className="grid gap-1 text-sm font-semibold">Nome no Studio<Input value={pageList.find((page) => page.slug === currentPageSlug)?.title ?? ""} onChange={(event) => updateCurrentPage({ title: event.target.value })} /></label>
                  <label className="mt-3 grid gap-1 text-sm font-semibold">URL<Input disabled={currentPageSlug === "inicio"} value={currentPageSlug} onChange={(event) => updateCurrentPage({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} /></label>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Tipo de bloco
                  </label>
                  <Select
                    value={current?.type}
                    onValueChange={(value) => updateBlock({ type: value as PageBlockType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hero">Hero</SelectItem>
                      <SelectItem value="Produtos">Produtos</SelectItem>
                      <SelectItem value="Coleções">Coleções</SelectItem>
                      <SelectItem value="Logo aleatório">Logo aleatório</SelectItem>
                      <SelectItem value="Linktree">Linktree</SelectItem>
                      <SelectItem value="Localização">Localização</SelectItem>
                      <SelectItem value="Banner">Banner</SelectItem>
                      <SelectItem value="Texto">Texto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><label className="mb-2 block text-sm font-semibold">Antetítulo</label><Input value={current?.eyebrow ?? ""} onChange={(event) => updateBlock({ eyebrow: event.target.value })} /></div>
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
                <div className="grid grid-cols-2 gap-2"><div><label className="mb-2 block text-sm font-semibold">Texto do botão</label><Input value={current?.ctaLabel ?? ""} onChange={(event) => updateBlock({ ctaLabel:event.target.value })}/></div><div><label className="mb-2 block text-sm font-semibold">Link</label><Input value={current?.ctaUrl ?? ""} onChange={(event) => updateBlock({ ctaUrl:event.target.value })}/></div></div>
                <div><label className="mb-2 block text-sm font-semibold">Imagem de fundo</label><Input value={current?.imageUrl ?? ""} onChange={(event)=>updateBlock({imageUrl:event.target.value})} placeholder="URL da fotografia do edifício ou banner"/></div>
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
                <details className="rounded-2xl border border-black/10 p-4"><summary className="cursor-pointer text-sm font-black">Traduções deste bloco</summary><div className="mt-4 space-y-4">{["pt","es","de","fr"].map((locale)=>{const translation=current?.translations?.[locale]??{};const updateTranslation=(patch:Record<string,string>)=>updateBlock({translations:{...(current?.translations??{}),[locale]:{...translation,...patch}}});return <div key={locale} className="rounded-xl bg-[#f5f5f2] p-3"><p className="mb-2 text-xs font-black uppercase">{locale}</p><div className="grid gap-2"><Input value={translation.title??""} onChange={(event)=>updateTranslation({title:event.target.value})} placeholder="Título"/><textarea value={translation.description??""} onChange={(event)=>updateTranslation({description:event.target.value})} placeholder="Descrição" className="min-h-20 border border-input bg-white p-3"/></div></div>})}</div></details>
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
                    {["var(--brand)", "var(--accent-brand)", "var(--ink)", "#ffffff"].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => updateBlock({ background: color })}
                          className={`aspect-square border-2 ${current?.background === color ? "border-black" : "border-transparent"}`}
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
                  <Select value={current?.width ?? "content"} onValueChange={(value) => updateBlock({ width:value as Block["width"] })}>
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
                <div><label className="mb-2 block text-sm font-semibold">Alinhamento</label><Select value={current?.align ?? "left"} onValueChange={(value)=>updateBlock({align:value as Block["align"]})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="left">Esquerda</SelectItem><SelectItem value="center">Centro</SelectItem></SelectContent></Select></div>
                <div><label className="mb-2 block text-sm font-semibold">Espaçamento</label><Select value={current?.spacing ?? "normal"} onValueChange={(value)=>updateBlock({spacing:value as Block["spacing"]})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="compact">Compacto</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="large">Amplo</SelectItem></SelectContent></Select></div>
              </TabsContent>
            </Tabs>
            <div className="mt-8 border-t pt-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <GripVertical className="size-4" />
                Estrutura da página
              </p>
              <ol className="mt-3 space-y-2">
                {blocks.map((block) => (
                  <li key={block.id} draggable onDragStart={() => setDraggedBlockId(block.id)} onDragEnd={() => setDraggedBlockId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!draggedBlockId || draggedBlockId === block.id) return; const next=[...blocks]; const from=next.findIndex((item)=>item.id===draggedBlockId); const to=next.findIndex((item)=>item.id===block.id); const [moved]=next.splice(from,1); next.splice(to,0,moved); setBlocks(next); setDraggedBlockId(null); }}>
                    <button
                      onClick={() => setSelected(block.id)}
                      className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm ${selected === block.id ? "bg-[#fff0ea] text-[#d33b10]" : "bg-[#f5f5f2]"}`}
                    >
                      <GripVertical className="size-4 shrink-0 opacity-40" />{block.type} · {block.title}
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
