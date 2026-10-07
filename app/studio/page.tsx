"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  BarChart3,
  CirclePower,
  Contrast,
  Eye,
  GripVertical,
  Images,
  LayoutTemplate,
  LockKeyhole,
  Move,
  MoreVertical,
  Monitor,
  Package,
  Palette,
  Plus,
  Save,
  Search,
  Settings,
  ShoppingBag,
  Smartphone,
  Store,
  Tablet,
  Trash2,
  UploadCloud,
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
import { DEFAULT_COLLECTION_TEMPLATE_BLOCKS, DEFAULT_PAGE_BLOCKS, withRequiredHomeBlocks, type PageBlock as Block, type PageBlockType } from "@/lib/page-blocks";
import { PageBlock } from "@/components/page-block";
import { ProductMockup } from "@/components/product-mockup";
import { SupportIcon } from "@/components/support-icon";
import { ArtworkPlacementEditor } from "@/components/artwork-placement-editor";
import type { ArtworkPlacements } from "@/lib/artwork-placement";
import { DEFAULT_NAVIGATION, type NavigationItem } from "@/lib/site-navigation";
import { BrandLogo } from "@/components/brand-logo";
import { DefaultPlacementControl } from "@/components/default-placement-control";
import { CssStudio, type CssFile } from "@/components/css-studio";

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
  seoTitle: string;
  seoDescription: string;
  seoCanonical: string;
  seoNoIndex: boolean;
  imageKey: string;
  gallery: string[];
  disabledSupports: string[];
  artworkPlacements: ArtworkPlacements;
  colors: string[];
  previewColorIds: string[];
  sizes: string[];
  variants: ProductVariant[];
  sortOrder: number;
  monochrome: boolean;
  onlineSaleEnabled: boolean;
  salesRank: number;
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
    productType?: string;
    color: string;
    size: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  shippingCents: number;
  totalCents: number;
  status: string;
  paymentProvider: string | null;
  trackingCode: string;
  trackingUrl: string;
  internalNotes: string;
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
  launchSplash: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    description: string;
    shoulderTagLabel: string;
  };
  navigation: NavigationItem[];
  terms: string;
  privacy: string;
  returns: string;
  cssFiles: CssFile[];
  media: Array<{
    url: string;
    alt: string;
    kind: "artwork" | "lifestyle" | "base";
    productSlug?: string;
    role?: "cover" | "gallery" | "standalone";
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
const collectionTemplatePage: StudioPage = {
  slug: "collection-template",
  title: "Template de coleção",
  blocks: DEFAULT_COLLECTION_TEMPLATE_BLOCKS,
  status: "published",
};

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
    seoTitle: "",
    seoDescription: "",
    seoCanonical: "",
    seoNoIndex: false,
    imageKey: "/products/white-shirt-1.jpg",
    gallery: [],
    disabledSupports: [],
    artworkPlacements: {},
    colors: ["Branco"],
    previewColorIds: [],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    variants: [],
    sortOrder: 1,
    monochrome: true,
    onlineSaleEnabled: true,
    salesRank: 0,
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
    seoTitle: "",
    seoDescription: "",
    seoCanonical: "",
    seoNoIndex: false,
    imageKey: "/products/red-shirt-1.jpg",
    gallery: [],
    disabledSupports: [],
    artworkPlacements: {},
    colors: ["Vermelho"],
    previewColorIds: [],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    variants: [],
    sortOrder: 2,
    monochrome: true,
    onlineSaleEnabled: true,
    salesRank: 0,
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
    seoTitle: "",
    seoDescription: "",
    seoCanonical: "",
    seoNoIndex: false,
    imageKey: "/products/blue-shirt-1.jpg",
    gallery: [],
    disabledSupports: [],
    artworkPlacements: {},
    colors: ["Azul"],
    previewColorIds: [],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    variants: [],
    sortOrder: 3,
    monochrome: false,
    onlineSaleEnabled: true,
    salesRank: 0,
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
  launchSplash: {
    enabled: true,
    eyebrow: "New online shop",
    title: "Coming\nsoon.",
    description: "Original designs, printed locally and made to travel. The new Made in Maia shop is almost here.",
    shoulderTagLabel: "Try the shoulder tag",
  },
  navigation: DEFAULT_NAVIGATION,
  terms: "",
  privacy: "",
  returns: "",
  cssFiles: [{ id:"made-in-maia-custom", name:"made-in-maia-custom.css", content:"/* Custom Made in Maia styles */\n", enabled:true }],
  media: [],
  theme: {
    brandColor: "#ff4f1f",
    accentColor: "#d9ff43",
    darkColor: "#171713",
    backgroundColor: "#f4f3ef",
  },
  productCatalog: { colors: DEFAULT_COLORS, supports: DEFAULT_SUPPORTS },
};

function stableProductBlockOrder(blockId:number,slug:string){return [...`${blockId}-${slug}`].reduce((total,character)=>((total*33)+character.charCodeAt(0))>>>0,5381);}

export default function Studio() {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [pageList, setPageList] = useState<StudioPage[]>([
    { slug: "inicio", title: "Início", blocks: initialBlocks, status: "draft" },
    collectionTemplatePage,
  ]);
  const [currentPageSlug, setCurrentPageSlug] = useState("inicio");
  const [selected, setSelected] = useState(1);
  const [viewport, setViewport] = useState("desktop");
  const [published, setPublished] = useState(false);
  const [studioKey, setStudioKey] = useState("");
  const [studioUser, setStudioUser] = useState("");
  const [username, setUsername] = useState("madeinmaia");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState<
    "pages" | "blog" | "menus" | "products" | "discover" | "orders" | "catalog" | "media" | "settings"
  >("pages");
  const [discoveries, setDiscoveries] = useState(initialDiscoveries);
  const [catalogue, setCatalogue] = useState(initialProducts);
  const [productQuery, setProductQuery] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(() => new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentConfigured, setPaymentConfigured] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [uploading, setUploading] = useState(false);
  const [productImageUploading, setProductImageUploading] = useState<number | null>(null);
  const [productImageDragOver, setProductImageDragOver] = useState<number | null>(null);
  const [galleryUploading, setGalleryUploading] = useState<number | null>(null);
  const [galleryDragOver, setGalleryDragOver] = useState<number | null>(null);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const [linkLabelUploading, setLinkLabelUploading] = useState<number | null>(null);
  const [linkLabelDragOver, setLinkLabelDragOver] = useState<number | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [placementProductId, setPlacementProductId] = useState<number | null>(null);
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "artwork" | "lifestyle" | "base">("all");
  const [mediaPage, setMediaPage] = useState(1);
  const [draggedColorId, setDraggedColorId] = useState<string | null>(null);
  const [colorConfigId, setColorConfigId] = useState<string | null>(null);
  const [draggedProductId, setDraggedProductId] = useState<number | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);
  const [editorSidebarTab, setEditorSidebarTab] = useState<"blocks" | "settings" | "style">("blocks");
  const current = useMemo(
    () => blocks.find((block) => block.id === selected) ?? blocks[0],
    [blocks, selected],
  );
  const filteredMedia = useMemo(() => settings.media.map((item,index)=>({item,index})).filter(({item})=>{
    const query=mediaQuery.trim().toLowerCase();
    return (mediaFilter==="all"||item.kind===mediaFilter)&&(!query||`${item.alt} ${item.url} ${item.productSlug??""}`.toLowerCase().includes(query));
  }),[settings.media,mediaFilter,mediaQuery]);
  const mediaPageCount=Math.max(1,Math.ceil(filteredMedia.length/12));
  const currentMediaPage=Math.min(mediaPage,mediaPageCount);
  const pagedMedia=filteredMedia.slice((currentMediaPage-1)*12,currentMediaPage*12);
  const filteredCatalogue = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    return catalogue.filter((product) => {
      const statusMatches = productStatusFilter === "all" || (productStatusFilter === "active" ? product.status === "published" : product.status !== "published");
      const queryMatches = !query || `${product.name} ${product.designCode} ${product.slug} ${product.collection} ${product.tags.join(" ")}`.toLowerCase().includes(query);
      return statusMatches && queryMatches;
    });
  }, [catalogue, productQuery, productStatusFilter]);
  const availableProductTags = useMemo(() => [...new Set(catalogue.flatMap((product)=>[product.collection,...product.tags]).filter(Boolean))].sort((a,b)=>a.localeCompare(b)), [catalogue]);
  function productsForEditorBlock(block:Block) {
    let items=catalogue.filter((product)=>product.status==="published");
    if(block.productSource==="tag"&&block.productTag){const tag=block.productTag.toLowerCase();items=items.filter((product)=>product.collection.toLowerCase()===tag||product.tags.some((item)=>item.toLowerCase()===tag));}
    if(block.productSource==="selection"&&block.productSlugs?.length){const selected=new Set(block.productSlugs);items=items.filter((product)=>selected.has(product.slug));}
    if(block.productOrder==="asc")items=[...items].sort((a,b)=>a.name.localeCompare(b.name));
    if(block.productOrder==="desc")items=[...items].sort((a,b)=>b.name.localeCompare(a.name));
    if(block.productOrder==="random")items=[...items].sort((a,b)=>stableProductBlockOrder(block.id,a.slug)-stableProductBlockOrder(block.id,b.slug));
    return items.slice(0,Math.min(64,Math.max(1,block.productLimit??6)));
  }

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
  function addBlogPost() {
    const number = pageList.filter((page) => page.slug.startsWith("blog-")).length + 1;
    const page: StudioPage = {
      slug: `blog-novo-artigo-${number}`,
      title: "Novo artigo",
      blocks: [
        { id:Date.now(), type:"Hero", eyebrow:"Made in Maia Journal", title:"Novo artigo", description:"Escreve aqui o resumo do artigo.", background:"var(--surface)", textColor:"var(--foreground)", width:"content", align:"left", spacing:"large" },
        { id:Date.now()+1, type:"Texto", eyebrow:"História", title:"Começa aqui", description:"Desenvolve o artigo em blocos. Podes acrescentar imagens, chamadas para ação e reorganizar tudo no editor.", background:"var(--paper)", textColor:"var(--foreground)", width:"narrow", align:"left", spacing:"normal" },
      ],
      status: "draft",
    };
    setPageList([...pageSnapshot(), page]);
    setCurrentPageSlug(page.slug);
    setBlocks(page.blocks);
    setSelected(page.blocks[0].id);
    setPublished(false);
    setSection("pages");
  }
  async function deleteCurrentPage() {
    if (currentPageSlug === "inicio") return;
    const page = pageList.find((entry) => entry.slug === currentPageSlug);
    if (!page || !window.confirm(`Remover a página “${page.title}”? Esta ação não pode ser anulada.`)) return;
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: { "content-type": "application/json", "x-studio-user": studioUser, "x-studio-key": studioKey },
      body: JSON.stringify({ resource: "page-delete", reference: currentPageSlug }),
    });
    if (!response.ok) {
      toast.error("Não foi possível remover a página.");
      return;
    }
    const remaining = pageList.filter((entry) => entry.slug !== currentPageSlug);
    const next = remaining.find((entry) => entry.slug === "inicio") ?? remaining[0];
    setPageList(remaining);
    if (next) {
      setCurrentPageSlug(next.slug);
      setBlocks(next.blocks);
      setSelected(next.blocks[0]?.id ?? 0);
      setPublished(next.status === "published");
    }
    toast.success("Página removida");
  }
  function updateCurrentPage(patch: Partial<Pick<StudioPage, "title" | "slug">>) {
    const oldSlug = currentPageSlug;
    const nextSlug = patch.slug ?? oldSlug;
    setPageList((items) => items.map((page) =>
      page.slug === oldSlug ? { ...page, ...patch, blocks } : page,
    ));
    if (nextSlug !== oldSlug) setCurrentPageSlug(nextSlug);
  }
  function addBlock(type:PageBlockType = "Texto") {
    const id = Math.max(0, ...blocks.map((block) => block.id)) + 1;
    setBlocks((items) => [
      ...items,
      {
        id,
        type,
        title: type === "Hero" ? "New hero" : type === "Produtos" ? "Products" : type === "Coleções" ? "Collections" : "New block",
        description: "Escreve aqui o conteúdo desta secção.",
        background: "#ffffff",
        textColor: "var(--ink)",
        width: "content",
        align: "left",
        spacing: "normal",
      },
    ]);
    setSelected(id);
    setEditorSidebarTab("settings");
  }
  async function save() {
    if (section === "settings" || section === "catalog" || section === "menus") {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studio-user": studioUser,
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
          "x-studio-user": studioUser,
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
      const [response, mediaResponse] = await Promise.all([fetch("/api/studio", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studio-user": studioUser,
          "x-studio-key": studioKey,
        },
        body: JSON.stringify({ resource: "products", entries: loadedProducts }),
      }), fetch("/api/studio", { method:"POST", headers:{"content-type":"application/json","x-studio-user":studioUser,"x-studio-key":studioKey}, body:JSON.stringify({resource:"settings",entries:[settings]}) })]);
      if (response.ok && mediaResponse.ok) toast.success("Catálogo e biblioteca guardados");
      else toast.error("Não foi possível guardar o catálogo.");
      return;
    }
    if (section === "discover") {
      const [response, mediaResponse] = await Promise.all([fetch("/api/studio", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studio-user": studioUser,
          "x-studio-key": studioKey,
        },
        body: JSON.stringify({
          resource: "random-content",
          entries: discoveries,
        }),
      }), fetch("/api/studio", { method:"POST", headers:{"content-type":"application/json","x-studio-user":studioUser,"x-studio-key":studioKey}, body:JSON.stringify({resource:"settings",entries:[settings]}) })]);
      if (response.ok && mediaResponse.ok) toast.success("Link Labels e biblioteca guardadas");
      else toast.error("Não foi possível guardar os conteúdos.");
      return;
    }
    const pagesToSave = pageSnapshot();
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-studio-user": studioUser,
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
      setStudioUser("");
      setStudioKey("");
      toast.error("A sessão do Studio deixou de ser válida.");
    } else toast.error("Não foi possível guardar na base de dados.");
  }

  async function unlock(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/studio", {
      headers: { "x-studio-user": username.trim(), "x-studio-key": password },
    });
    if (!response.ok) {
      toast.error("O utilizador ou a palavra-passe não são válidos.");
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
      storageWarnings?: string[];
    };
    if (data.pages?.length) {
      const normalizedPages = data.pages.map((page) => ({
        ...page,
        blocks: page.slug === "inicio" ? withRequiredHomeBlocks(page.blocks) : page.blocks,
        status: page.status === "published" ? "published" as const : "draft" as const,
      }));
      if (!normalizedPages.some((page) => page.slug === collectionTemplatePage.slug)) normalizedPages.push(collectionTemplatePage);
      const home = normalizedPages.find((page) => page.slug === "inicio") ?? normalizedPages[0];
      setPageList(normalizedPages);
      setCurrentPageSlug(home.slug);
      setBlocks(home.blocks);
      setSelected(home.blocks[0]?.id ?? 0);
      setPublished(home.status === "published");
    } else if (data.page?.blocks?.length) {
      const homeBlocks = withRequiredHomeBlocks(data.page.blocks);
      setBlocks(homeBlocks);
      setPageList([{ slug: "inicio", title: "Início", blocks: homeBlocks, status: data.page.status === "published" ? "published" : "draft" }, collectionTemplatePage]);
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
        data.products.map((entry, index) => ({
          id: entry.id,
          slug: entry.slug ?? "",
          designCode: entry.designCode ?? "",
          name: entry.name ?? "",
          nameTranslations: entry.nameTranslations ?? {},
          description: entry.description ?? "",
          priceCents: entry.priceCents ?? 0,
          collection: entry.collection ?? "Made in Maia",
          tags: entry.tags ?? [],
          seoTitle: entry.seoTitle ?? "",
          seoDescription: entry.seoDescription ?? "",
          seoCanonical: entry.seoCanonical ?? "",
          seoNoIndex: entry.seoNoIndex === true,
          imageKey: entry.imageKey ?? "",
          gallery: entry.gallery ?? [],
          disabledSupports: entry.disabledSupports ?? [],
          artworkPlacements: entry.artworkPlacements ?? {},
          colors: entry.colors ?? [],
          previewColorIds: entry.previewColorIds ?? [],
          sizes: entry.sizes ?? [],
          variants: (entry.variants ?? []).map((variant) => ({
            ...variant,
            type: variant.type ?? "adult-tshirt",
            active: variant.active !== false,
          })),
          sortOrder: entry.sortOrder ?? index + 1,
          monochrome: entry.monochrome === true,
          onlineSaleEnabled: entry.onlineSaleEnabled !== false,
          salesRank: entry.salesRank ?? 0,
          status: entry.status === "published" ? "published" : "draft",
          detailsLoaded: false,
        })),
      );
    setOrders(data.orders ?? []);
    setPaymentConfigured(Boolean(data.paymentConfigured));
    if (data.storageWarnings?.length)
      toast.warning(`Base de dados incompleta: ${data.storageWarnings.join(", ")}. Os restantes conteúdos continuam disponíveis.`);
    if (data.settings)
      setSettings({
        ...initialSettings,
        ...data.settings,
        launchSplash: { ...initialSettings.launchSplash, ...data.settings.launchSplash },
        theme: { ...initialSettings.theme, ...data.settings.theme },
        cssFiles: Array.isArray(data.settings.cssFiles) ? data.settings.cssFiles : initialSettings.cssFiles,
        productCatalog: {
          colors: data.settings.productCatalog?.colors ?? DEFAULT_COLORS,
          supports: (data.settings.productCatalog?.supports ?? DEFAULT_SUPPORTS).filter((support) => support.id !== "sunglasses").map(normalizeSupport),
        },
        media: (data.settings.media ?? []).map((item) => ({
          ...item,
          kind: item.kind ?? "artwork",
        })),
        navigation: data.settings.navigation?.length ? [...data.settings.navigation, ...DEFAULT_NAVIGATION.filter((required)=>!data.settings!.navigation.some((item)=>item.id===required.id))] : DEFAULT_NAVIGATION,
      });
    setStudioUser(username.trim());
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
      headers: { "x-studio-user": studioUser, "x-studio-key": studioKey },
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
      seoTitle: data.product.seoTitle ?? "",
      seoDescription: data.product.seoDescription ?? "",
      seoCanonical: data.product.seoCanonical ?? "",
      seoNoIndex: data.product.seoNoIndex === true,
      gallery: data.product.gallery ?? [],
      disabledSupports: data.product.disabledSupports ?? [],
      artworkPlacements: data.product.artworkPlacements ?? {},
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
      headers: { "content-type": "application/json", "x-studio-user": studioUser, "x-studio-key": studioKey },
      body: JSON.stringify({ resource: "product-status", productId: product.id, status }),
    });
    if (!response.ok) toast.error("Não foi possível alterar o estado do produto.");
  }
  async function updateProductMonochrome(product: Product, monochrome: boolean) {
    updateProduct(product.id, { monochrome });
    if (product.id > 1_000_000_000_000) return;
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: { "content-type": "application/json", "x-studio-user": studioUser, "x-studio-key": studioKey },
      body: JSON.stringify({ resource: "product-monochrome", productId: product.id, monochrome }),
    });
    if (!response.ok) {
      updateProduct(product.id, { monochrome: product.monochrome });
      toast.error("Não foi possível alterar o modo de impressão.");
    }
  }
  async function updateProductOnlineSale(product: Product, onlineSaleEnabled: boolean) {
    updateProduct(product.id, { onlineSaleEnabled });
    if (product.id > 1_000_000_000_000) return;
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: { "content-type": "application/json", "x-studio-user": studioUser, "x-studio-key": studioKey },
      body: JSON.stringify({ resource: "product-online-sale", productId: product.id, onlineSaleEnabled }),
    });
    if (!response.ok) {
      updateProduct(product.id, { onlineSaleEnabled: product.onlineSaleEnabled });
      toast.error("Não foi possível alterar a disponibilidade online.");
    }
  }
  async function editProductPlacement(product:Product) {
    if (product.detailsLoaded || product.id > 1_000_000_000_000) { setPlacementProductId(product.id); return; }
    const response=await fetch(`/api/studio?productId=${product.id}`,{headers:{"x-studio-user":studioUser,"x-studio-key":studioKey}});
    if(!response.ok){toast.error("Não foi possível carregar o produto.");return;}
    const data=(await response.json()) as {product:Partial<Product>};
    setCatalogue((items)=>items.map((item)=>item.id===product.id?{...item,...data.product,artworkPlacements:data.product.artworkPlacements??{},detailsLoaded:true}:item));
    setPlacementProductId(product.id);
  }
  async function saveProductPlacement(product:Product, artworkPlacements:ArtworkPlacements) {
    updateProduct(product.id,{artworkPlacements});
    if(product.id>1_000_000_000_000)return;
    const response=await fetch("/api/studio",{method:"POST",headers:{"content-type":"application/json","x-studio-user":studioUser,"x-studio-key":studioKey},body:JSON.stringify({resource:"product-placement",productId:product.id,artworkPlacements})});
    if(response.ok)toast.success("Posicionamento guardado.");else toast.error("Não foi possível guardar o posicionamento.");
  }
  async function saveProduct(product: Product) {
    setSavingProductId(product.id);
    try {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: { "content-type": "application/json", "x-studio-user": studioUser, "x-studio-key": studioKey },
        body: JSON.stringify({ resource: "products", entries: [product] }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setStudioUser("");
          setStudioKey("");
          toast.error("A sessão do Studio deixou de ser válida.");
        } else toast.error("Não foi possível guardar o produto.");
        return;
      }
      const result = await response.json() as { products?: { id:number; slug:string }[] };
      const saved = result.products?.find((item) => item.slug === product.slug);
      if (saved && saved.id !== product.id) {
        setCatalogue((items) => items.map((item) => item.id === product.id ? { ...item, id:saved.id } : item));
        setExpandedProductId((current) => current === product.id ? saved.id : current);
        setSelectedProductIds((current) => {
          if (!current.has(product.id)) return current;
          const next = new Set(current);
          next.delete(product.id);
          next.add(saved.id);
          return next;
        });
      }
      toast.success(`“${product.name}” guardado`);
    } finally {
      setSavingProductId(null);
    }
  }
  async function persistProductOrder(next: Product[]) {
    setCatalogue(next.map((product, index) => ({ ...product, sortOrder: index + 1 })));
    const saved = next.filter((product) => product.id < 1_000_000_000_000);
    if (!saved.length) return;
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: { "content-type": "application/json", "x-studio-user": studioUser, "x-studio-key": studioKey },
      body: JSON.stringify({ resource: "product-order", entries: saved.map((product) => product.id) }),
    });
    if (!response.ok) toast.error("Não foi possível guardar a ordem dos produtos.");
  }
  function moveProduct(productId: number, direction: -1 | 1) {
    const moving = selectedProductIds.has(productId) ? selectedProductIds : new Set([productId]);
    const next = [...catalogue];
    if (direction === -1) {
      for (let index = 1; index < next.length; index += 1) {
        if (moving.has(next[index].id) && !moving.has(next[index - 1].id)) [next[index - 1], next[index]] = [next[index], next[index - 1]];
      }
    } else {
      for (let index = next.length - 2; index >= 0; index -= 1) {
        if (moving.has(next[index].id) && !moving.has(next[index + 1].id)) [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
    }
    void persistProductOrder(next);
  }
  function toggleProductSelection(productId: number) {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId); else next.add(productId);
      return next;
    });
  }
  function startProductDrag(productId: number) {
    if (!selectedProductIds.has(productId)) setSelectedProductIds(new Set([productId]));
    setDraggedProductId(productId);
  }
  function dropProduct(targetId: number) {
    if (draggedProductId === null || draggedProductId === targetId) return setDraggedProductId(null);
    const movingIds = selectedProductIds.has(draggedProductId) ? selectedProductIds : new Set([draggedProductId]);
    if (movingIds.has(targetId)) return setDraggedProductId(null);
    const moved = catalogue.filter((product) => movingIds.has(product.id));
    const remaining = catalogue.filter((product) => !movingIds.has(product.id));
    const target = remaining.findIndex((product) => product.id === targetId);
    if (!moved.length || target < 0) return setDraggedProductId(null);
    const next = [...remaining.slice(0, target), ...moved, ...remaining.slice(target)];
    setDraggedProductId(null);
    void persistProductOrder(next);
  }
  async function deleteProduct(product: Product) {
    if (!window.confirm(`Apagar definitivamente “${product.name}”?`)) return;
    if (product.id < 1_000_000_000_000) {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: { "content-type": "application/json", "x-studio-user": studioUser, "x-studio-key": studioKey },
        body: JSON.stringify({ resource: "product-delete", productId: product.id }),
      });
      if (!response.ok) return toast.error("Não foi possível apagar o produto.");
    }
    setCatalogue((items) => items.filter((item) => item.id !== product.id));
    setSelectedProductIds((current) => { const next = new Set(current); next.delete(product.id); return next; });
    if (expandedProductId === product.id) setExpandedProductId(null);
    toast.success("Produto apagado");
  }
  async function updateOrderStatus(reference: string, status: string) {
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-studio-user": studioUser,
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
  async function saveOrderDetails(order:Order) {
    const response=await fetch("/api/studio",{method:"POST",headers:{"content-type":"application/json","x-studio-user":studioUser,"x-studio-key":studioKey},body:JSON.stringify({resource:"order-details",reference:order.reference,trackingCode:order.trackingCode,trackingUrl:order.trackingUrl,internalNotes:order.internalNotes})});
    if(response.ok)toast.success("Detalhes da encomenda guardados");else toast.error("Não foi possível guardar os detalhes.");
  }

  async function crunchArtworkPng(file: File) {
    if (file.type !== "image/png") throw new Error("A imagem de capa tem de ser um ficheiro PNG.");
    if (file.size > 10 * 1024 * 1024) throw new Error("O PNG não pode exceder 10 MB.");
    const bitmap = await createImageBitmap(file);
    const maxSide = 2400;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível processar o PNG.");
    context.clearRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Não foi possível otimizar o PNG.");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
  }

  async function uploadMedia(file: File, kind?: "artwork" | "lifestyle" | "base") {
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "x-studio-user": studioUser, "x-studio-key": studioKey },
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
            kind: kind ?? (file.type === "image/png" ? "artwork" : "lifestyle"),
          },
        ],
      }));
      toast.success("Imagem carregada. Guarda a biblioteca para confirmar.");
      return data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function uploadLinkLabelMedia(entryId: number, file: File) {
    setLinkLabelUploading(entryId);
    try {
      const url = await uploadMedia(file, "lifestyle");
      if (url) updateDiscovery(entryId, { mediaUrl: url });
    } finally {
      setLinkLabelUploading(null);
      setLinkLabelDragOver(null);
    }
  }

  async function uploadProductArtwork(productId: number, file: File) {
    setProductImageUploading(productId);
    try {
      const optimized = await crunchArtworkPng(file);
      const url = await uploadMedia(optimized, "artwork");
      if (url) {
        updateProduct(productId, { imageKey: url });
        const product = catalogue.find((item) => item.id === productId);
        setSettings((current) => ({
          ...current,
          media: current.media.map((item) => item.url === url ? { ...item, productSlug: product?.slug, role: "cover" as const } : item),
        }));
        toast.success(optimized.size < file.size ? `PNG otimizado: ${Math.round(file.size / 1024)} KB → ${Math.round(optimized.size / 1024)} KB` : "PNG carregado e preparado.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível processar o PNG.");
    } finally {
      setProductImageUploading(null);
      setProductImageDragOver(null);
    }
  }

  async function uploadProductGallery(productId: number, files: File[]) {
    if (!files.length) return;
    setGalleryUploading(productId);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const url = await uploadMedia(file, "lifestyle");
        if (url) uploaded.push(url);
      }
      if (uploaded.length) {
        const product = catalogue.find((item) => item.id === productId);
        updateProduct(productId, { gallery: [...(product?.gallery ?? []), ...uploaded] });
        setSettings((current) => ({ ...current, media: current.media.map((item) => uploaded.includes(item.url) ? { ...item, productSlug: product?.slug, role: "gallery" as const } : item) }));
        toast.success(`${uploaded.length} fotografia${uploaded.length === 1 ? "" : "s"} adicionada${uploaded.length === 1 ? "" : "s"} ao produto.`);
      }
    } finally {
      setGalleryUploading(null);
      setGalleryDragOver(null);
    }
  }

  if (!studioKey)
    return (
      <main className="storefront-dark grid min-h-screen place-items-center bg-[var(--paper)] p-6 text-[var(--foreground)]">
        <Toaster position="bottom-right" />
        <form
          onSubmit={unlock}
          className="w-full max-w-md border border-white/10 bg-[var(--surface)] p-8 text-[var(--foreground)] shadow-2xl"
        >
          <span className="grid size-12 place-items-center bg-[var(--brand)] text-white">
            <LockKeyhole />
          </span>
          <div className="mt-6"><BrandLogo className="h-24 w-auto" /><h1 className="mt-3 text-sm font-black uppercase tracking-[.18em] text-white/55">Studio</h1></div>
          <p className="mt-3 text-white/60">
            Introduz o utilizador e a palavra-passe definidos para o Studio.
          </p>
          <label className="mt-7 block text-sm font-semibold" htmlFor="studio-username">Utilizador</label>
          <Input id="studio-username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 h-12 border-white/15 bg-white/5 text-white placeholder:text-white/30" autoComplete="username" autoFocus required />
          <label
            className="mt-4 block text-sm font-semibold"
            htmlFor="studio-password"
          >
            Palavra-passe
          </label>
          <Input
            id="studio-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-12 border-white/15 bg-white/5 text-white placeholder:text-white/30"
            autoComplete="current-password"
            required
          />
          <Button
            type="submit"
            className="mt-4 h-12 w-full rounded-none bg-[var(--accent-brand)] font-black text-black hover:bg-[#c8ef39]"
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
    <main id="mim-studio" className="mim-studio min-h-screen overflow-x-clip bg-[#0d0d0c] text-[#f4f3ef]">
      <Toaster position="bottom-right" />
      <header className="mim-studio__header flex min-h-16 min-w-0 flex-wrap items-center gap-2 border-b border-black/10 bg-[var(--ink)] px-3 py-3 text-white sm:gap-4 sm:px-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-black uppercase tracking-tight"
        >
          <BrandLogo className="h-14 w-auto sm:h-16" /><span className="hidden text-xs text-white/55 sm:inline">Studio</span>
        </Link>
        <span className="h-6 w-px bg-white/20" />
        <span className="hidden min-w-0 truncate text-sm text-white/65 md:block">
          {section === "pages"
            ? `Página: ${pageList.find((page) => page.slug === currentPageSlug)?.title ?? "Início"}`
            : section === "menus"
              ? "Navegação principal"
            : section === "blog"
              ? "Made in Maia Journal"
            : section === "discover"
              ? "Link Labels"
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
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/" target="_blank">
              <Eye />
              <span className="hidden lg:inline">Pré-visualizar</span>
            </Link>
          </Button>
          <Button
            onClick={save}
            className="rounded-none bg-[var(--accent-brand)] text-black hover:bg-[#c8ef39]"
          >
            <Save />
            <span className="hidden sm:inline">Guardar</span>
          </Button>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[220px_minmax(0,1fr)_310px] max-lg:grid-cols-[72px_minmax(0,1fr)]">
        <aside className="border-r border-black/10 bg-white p-3">
          <nav className="grid gap-2">
            <Button onClick={() => setSection("pages")} variant={section === "pages" ? "secondary" : "ghost"} className="justify-start rounded-none max-lg:px-3"><LayoutTemplate/><span className="max-lg:hidden">Páginas</span></Button>
            {section==="pages"&&<div className="ml-5 grid gap-1 border-l border-black/10 pl-3 max-lg:hidden"><button className="py-1 text-left text-xs font-bold" onClick={()=>document.getElementById("page-manager")?.scrollIntoView({behavior:"smooth"})}>Todas as páginas</button><button className="py-1 text-left text-xs font-bold text-[var(--brand)]" onClick={addPage}>+ Nova página</button></div>}
            <Button onClick={() => setSection("blog")} variant={section === "blog" ? "secondary" : "ghost"} className="justify-start rounded-none max-lg:px-3"><BookOpen/><span className="max-lg:hidden">Blog</span></Button>
            {section==="blog"&&<div className="ml-5 grid gap-1 border-l border-black/10 pl-3 max-lg:hidden"><button className="py-1 text-left text-xs font-bold">Todos os artigos</button><button className="py-1 text-left text-xs font-bold text-[var(--brand)]" onClick={addBlogPost}>+ Novo artigo</button></div>}
            {[{icon:GripVertical,label:"Menus",value:"menus"},{icon:Palette,label:"Link Labels",value:"discover"},{icon:Package,label:"Produtos",value:"products"},{icon:Images,label:"Media",value:"media"},{icon:Store,label:"Encomendas",value:"orders"}].map(({icon:Icon,label,value})=><Button key={label} onClick={()=>setSection(value as typeof section)} variant={section===value?"secondary":"ghost"} className="justify-start rounded-none max-lg:px-3"><Icon/><span className="max-lg:hidden">{label}</span></Button>)}
            <Button onClick={() => setSection("settings")} variant={section === "settings"||section==="catalog" ? "secondary" : "ghost"} className="justify-start rounded-none max-lg:px-3"><Settings/><span className="max-lg:hidden">Definições</span></Button>
            {(section==="settings"||section==="catalog")&&<div className="ml-5 grid gap-1 border-l border-black/10 pl-3 max-lg:hidden">{[["settings-general","Geral e SEO"],["settings-splash","Splash screen"],["settings-theme","Theme Builder"],["settings-css","CSS Studio"]].map(([id,label])=><button key={id} className="py-1 text-left text-xs font-bold" onClick={()=>{setSection("settings");setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"}),0)}}>{label}</button>)}<button className="py-1 text-left text-xs font-bold" onClick={()=>{setSection("catalog");setTimeout(()=>document.getElementById("catalog-colors")?.scrollIntoView({behavior:"smooth"}),0)}}>Cores e disponibilidade</button><button className="py-1 text-left text-xs font-bold" onClick={()=>{setSection("catalog");setTimeout(()=>document.getElementById("catalog-supports")?.scrollIntoView({behavior:"smooth"}),0)}}>Tipos de produto</button></div>}
          </nav>
        </aside>
        <section className="min-w-0 p-4 md:p-7">
          {section === "pages" ? (
            <>
              <div id="page-manager" className="mb-4 bg-white p-3 shadow-sm"><div className="mb-3 flex items-center justify-between"><strong className="text-xs uppercase tracking-[.12em]">Gestor de páginas · {pageList.filter((page)=>!page.slug.startsWith("blog-")).length}</strong><Button type="button" size="sm" variant="outline" className="rounded-none" onClick={addPage}><Plus/>Nova página</Button></div><div className="mb-3 flex flex-wrap gap-2">{pageList.filter((page)=>!page.slug.startsWith("blog-")||page.slug===currentPageSlug).map((page)=><button key={page.slug} type="button" onClick={()=>selectPage(page.slug)} className={`border px-3 py-2 text-xs font-bold ${currentPageSlug===page.slug?"border-[var(--brand)] bg-[var(--brand)] text-white":"border-black/10"}`}>{page.title}<span className="ml-2 opacity-50">{page.status}</span></button>)}</div><div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-black uppercase tracking-[.12em]">Página</label>
                <Select value={currentPageSlug} onValueChange={selectPage}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {pageList.filter((page)=>!page.slug.startsWith("blog-")||page.slug===currentPageSlug).map((page) => <SelectItem key={page.slug} value={page.slug}>{page.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                {currentPageSlug !== "inicio" && currentPageSlug !== "collection-template" && <Button type="button" variant="ghost" className="rounded-none text-red-500 hover:bg-red-500/10 hover:text-red-300" onClick={() => void deleteCurrentPage()}><Trash2 />Remover página</Button>}
                <Button type="button" variant="ghost" className="ml-auto rounded-none" asChild>
                  <Link href={currentPageSlug === "inicio" ? "/loja" : currentPageSlug === "collection-template" ? "/collections/cats" : currentPageSlug.startsWith("blog-") ? `/blog/${currentPageSlug.slice(5)}` : `/${currentPageSlug}`} target="_blank"><Eye />Abrir página</Link>
                </Button>
              </div></div>
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
                  <BrandLogo className="h-14 w-auto" />
                  <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold lg:flex">
                    {settings.navigation.filter((item) => item.visible).map((item) => <span key={item.id}>{item.label}</span>)}
                  </nav>
                  <span className="grid size-10 place-items-center"><ShoppingBag className="size-5" /></span>
                </div>
                <div>
                  {blocks.map((block, index) => (
                    <div key={block.id} className="group relative" onDragOver={(event)=>event.preventDefault()} onDrop={()=>{if(!draggedBlockId||draggedBlockId===block.id)return;const next=[...blocks];const from=next.findIndex((item)=>item.id===draggedBlockId);const to=next.findIndex((item)=>item.id===block.id);const [moved]=next.splice(from,1);next.splice(to,0,moved);setBlocks(next);setDraggedBlockId(null)}}>
                      <PageBlock block={block} contextTitle={pageList.find((page)=>page.slug===currentPageSlug)?.title??"Current post title"} editor selected={selected === block.id} onSelect={() => setSelected(block.id)} onEdit={(patch)=>{setSelected(block.id);setBlocks((items)=>items.map((item)=>item.id===block.id?{...item,...patch}:item))}}>
                        {block.type === "Produtos" ? <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{productsForEditorBlock(block).map((product) => <article key={product.id} className="text-[var(--ink)]"><div className="relative aspect-[4/5] overflow-hidden bg-white"><ProductMockup artwork={product.imageKey || "/products/white-shirt-1.jpg"} color={product.colors[0] ?? "White"} name={product.name} /><span className="absolute left-4 top-4 bg-[var(--accent-brand)] px-3 py-1 text-xs font-black uppercase">New</span></div><div className="flex items-start justify-between gap-4 pt-4"><div><p className="text-sm opacity-55">{product.tags.join(" · ") || product.collection}</p><h3 className="text-xl font-black uppercase tracking-[-.025em]">{product.name}</h3></div><strong className="text-lg">{(product.priceCents / 100).toFixed(2).replace(".", ",")} €</strong></div></article>)}</div> : block.type === "Coleções" ? <div className="grid gap-3 sm:grid-cols-3">{["Cats", "Quotes", "Jars"].map((tag) => <div key={tag} className="rounded-full border border-black/15 bg-white px-6 py-8 text-left text-2xl font-black uppercase">{tag}<span className="mt-2 block text-xs font-normal normal-case opacity-55">{catalogue.filter((product) => product.status === "published" && product.tags.includes(tag)).length} designs</span></div>)}</div> : undefined}
                      </PageBlock>
                      <span className="absolute right-3 top-3 z-20 inline-flex overflow-hidden rounded-full border border-white/15 bg-[#111]/90 text-white opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-within:opacity-100">
                        <button type="button" draggable onDragStart={()=>setDraggedBlockId(block.id)} onDragEnd={()=>setDraggedBlockId(null)} className="cursor-grab p-2 active:cursor-grabbing" aria-label="Drag block"><GripVertical className="size-4"/></button>
                        <button type="button" onClick={(event)=>{event.stopPropagation();setSelected(block.id);setEditorSidebarTab("settings")}} className="border-l border-white/15 p-2" aria-label="Block settings"><MoreVertical className="size-4"/></button>
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            move(index, -1);
                          }}
                          className="border-l border-white/15 p-2"
                        >
                          <ArrowUp className="size-4" />
                        </span>
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            move(index, 1);
                          }}
                          className="border-l border-white/15 p-2"
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
                    <div className="col-span-full ml-8 border-l-2 border-black/10 pl-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-black uppercase text-black/45">Submenu</span><Button type="button" size="sm" variant="ghost" onClick={()=>setSettings({...settings,navigation:settings.navigation.map((entry)=>entry.id===item.id?{...entry,children:[...(entry.children??[]),{id:crypto.randomUUID(),label:'Nova opção',url:'/',visible:true}]}:entry)})}><Plus/>Adicionar opção</Button></div>{(item.children??[]).map((child)=><div key={child.id} className="mb-2 grid gap-2 md:grid-cols-[1fr_1fr_44px_44px]"><Input aria-label="Nome da opção" value={child.label} onChange={(event)=>setSettings({...settings,navigation:settings.navigation.map((entry)=>entry.id===item.id?{...entry,children:(entry.children??[]).map((value)=>value.id===child.id?{...value,label:event.target.value}:value)}:entry)})}/><Input aria-label="Destino da opção" value={child.url} onChange={(event)=>setSettings({...settings,navigation:settings.navigation.map((entry)=>entry.id===item.id?{...entry,children:(entry.children??[]).map((value)=>value.id===child.id?{...value,url:event.target.value}:value)}:entry)})}/><Switch checked={child.visible} onCheckedChange={(visible)=>setSettings({...settings,navigation:settings.navigation.map((entry)=>entry.id===item.id?{...entry,children:(entry.children??[]).map((value)=>value.id===child.id?{...value,visible}:value)}:entry)})}/><Button type="button" size="icon" variant="ghost" className="text-red-600" onClick={()=>setSettings({...settings,navigation:settings.navigation.map((entry)=>entry.id===item.id?{...entry,children:(entry.children??[]).filter((value)=>value.id!==child.id)}:entry)})}><Trash2/></Button></div>)}</div>
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
                    madeinmaia.pt/linklabel
                  </p>
                  <h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">
                    Link Labels
                  </h1>
                  <p className="mt-3 max-w-2xl text-black/60">
                    Cada peça Made in Maia é uma label com um link. Cada visita
                    escolhe uma destas experiências ativas; os artigos publicados também entram no sorteio.
                  </p>
                </div>
                <Button asChild variant="outline" className="rounded-none">
                  <Link href="/linklabel" target="_blank">
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
                    {["image","meme","gif"].includes(entry.type)&&<div className="grid gap-4 md:grid-cols-[1fr_1fr]"><label className={`relative grid min-h-56 cursor-pointer place-items-center overflow-hidden border-2 border-dashed text-center ${linkLabelDragOver===entry.id?"border-[var(--brand)] bg-orange-50":"border-black/15 bg-black/[.025]"}`} onDragEnter={(event)=>{event.preventDefault();setLinkLabelDragOver(entry.id)}} onDragOver={(event)=>event.preventDefault()} onDragLeave={()=>setLinkLabelDragOver(null)} onDrop={(event)=>{event.preventDefault();const file=event.dataTransfer.files[0];if(file)void uploadLinkLabelMedia(entry.id,file)}}>{entry.mediaUrl?<Image src={entry.mediaUrl} alt={entry.title} fill sizes="420px" unoptimized className="object-contain p-3"/>:<span><UploadCloud className="mx-auto size-9 text-black/25"/><strong className="mt-2 block text-xs uppercase">{linkLabelUploading===entry.id?"A carregar…":"Larga aqui a imagem"}</strong><span className="mt-1 block text-[11px] text-black/40">PNG, JPG, WebP ou GIF</span></span>}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(event)=>{const file=event.target.files?.[0];if(file)void uploadLinkLabelMedia(entry.id,file);event.target.value=""}}/></label><div><p className="text-xs font-black uppercase">{entry.type==="meme"?"Meme fullscreen":entry.type==="gif"?"GIF fullscreen":"Imagem fullscreen"}</p><p className="mt-2 text-sm text-black/50">O ficheiro ocupa o ecrã; o título e a categoria aparecem discretamente por cima.</p>{entry.mediaUrl&&<Button type="button" variant="outline" className="mt-5 rounded-none" onClick={()=>updateDiscovery(entry.id,{mediaUrl:""})}><Trash2/>Remover media</Button>}</div></div>}
                    {entry.type==="youtube"&&<div className="grid gap-4 md:grid-cols-2"><label className="grid content-start gap-2 text-xs font-bold uppercase">URL do YouTube<Input value={entry.mediaUrl} onChange={(event)=>updateDiscovery(entry.id,{mediaUrl:event.target.value})} placeholder="https://youtube.com/watch?v=…"/><span className="normal-case font-normal text-black/45">O vídeo começa automaticamente, sem som, em fullscreen.</span></label><div className="aspect-video overflow-hidden bg-black">{entry.mediaUrl?<iframe className="h-full w-full" src={`${entry.mediaUrl.includes("youtu.be/")?`https://www.youtube-nocookie.com/embed/${entry.mediaUrl.split("youtu.be/")[1]?.split(/[?&]/)[0]}`:`https://www.youtube-nocookie.com/embed/${new URL(entry.mediaUrl,"https://youtube.com").searchParams.get("v")??""}`}?autoplay=1&mute=1&playsinline=1&rel=0`} title={entry.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>:<div className="grid h-full place-items-center text-xs font-bold uppercase text-white/40">Preview YouTube</div>}</div></div>}
                    {entry.type==="video"&&<div className="grid gap-4 md:grid-cols-2"><label className="grid content-start gap-2 text-xs font-bold uppercase">URL do vídeo<Input value={entry.mediaUrl} onChange={(event)=>updateDiscovery(entry.id,{mediaUrl:event.target.value})} placeholder="https://…/video.mp4"/><span className="normal-case font-normal text-black/45">MP4/WebM alojado externamente. Reprodução automática fullscreen.</span></label><div className="aspect-video bg-black">{entry.mediaUrl?<video src={entry.mediaUrl} controls muted autoPlay loop playsInline className="h-full w-full object-contain"/>:<div className="grid h-full place-items-center text-xs font-bold uppercase text-white/40">Preview vídeo</div>}</div></div>}
                    {["article","text"].includes(entry.type)&&<div><label className="mb-1 block text-xs font-bold uppercase">{entry.type==="article"?"Artigo / long page":"Mensagem curta"}</label><textarea value={entry.body} onChange={(event)=>updateDiscovery(entry.id,{body:event.target.value})} className={`w-full border border-input p-4 ${entry.type==="article"?"min-h-72":"min-h-28"}`} placeholder={entry.type==="article"?"Escreve o conteúdo editorial…":"Uma ideia curta…"}/><p className="mt-1 text-xs text-black/40">Aceita parágrafos. O texto será o protagonista da experiência.</p></div>}
                    {entry.type==="link"&&<div className="grid gap-4 rounded-xl bg-[#f4f4f0] p-4 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold uppercase">URL de destino<Input value={entry.linkUrl} onChange={(event)=>updateDiscovery(entry.id,{linkUrl:event.target.value})} placeholder="https://…"/></label><label className="grid gap-1 text-xs font-bold uppercase">Texto do botão<Input value={entry.linkLabel} onChange={(event)=>updateDiscovery(entry.id,{linkLabel:event.target.value})} placeholder="Visitar site"/></label><label className="col-span-full grid gap-1 text-xs font-bold uppercase">Porque vale a pena<textarea value={entry.body} onChange={(event)=>updateDiscovery(entry.id,{body:event.target.value})} className="min-h-24 border border-input p-3"/></label></div>}
                    <div className="mt-4 grid gap-3 border-t border-black/10 pt-4 md:grid-cols-[1fr_1fr_120px]"><label className="grid gap-1 text-xs font-bold uppercase">Link opcional<Input value={entry.linkUrl} onChange={(event)=>updateDiscovery(entry.id,{linkUrl:event.target.value})} placeholder="/marca ou https://…"/></label><label className="grid gap-1 text-xs font-bold uppercase">Texto do link<Input value={entry.linkLabel} onChange={(event)=>updateDiscovery(entry.id,{linkLabel:event.target.value})} placeholder="Saber mais"/></label><label className="grid gap-1 text-xs font-bold uppercase">Peso<Input type="number" min="1" value={entry.weight} onChange={(event)=>updateDiscovery(entry.id,{weight:Number(event.target.value)})}/></label></div>
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
                Adicionar Link Label
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
                                {item.quantity}× {item.name} · {item.productType || "Suporte"} · {item.size} ·{" "}
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
                              <SelectItem value="completed">Concluída</SelectItem>
                              <SelectItem value="cancelled">
                                Cancelada
                              </SelectItem>
                              <SelectItem value="refunded">Reembolsada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 border-t border-black/10 pt-5 md:grid-cols-2">
                        <label className="grid gap-1 text-xs font-bold uppercase"><span>Código de tracking</span><Input value={order.trackingCode??""} onChange={(event)=>setOrders((items)=>items.map((item)=>item.reference===order.reference?{...item,trackingCode:event.target.value}:item))} placeholder="Ex.: CTT123456789PT"/></label>
                        <label className="grid gap-1 text-xs font-bold uppercase"><span>Link de tracking</span><Input type="url" value={order.trackingUrl??""} onChange={(event)=>setOrders((items)=>items.map((item)=>item.reference===order.reference?{...item,trackingUrl:event.target.value}:item))} placeholder="https://..."/></label>
                        <label className="grid gap-1 text-xs font-bold uppercase md:col-span-2"><span>Notas internas</span><textarea value={order.internalNotes??""} onChange={(event)=>setOrders((items)=>items.map((item)=>item.reference===order.reference?{...item,internalNotes:event.target.value}:item))} rows={3} className="min-h-24 border border-black/15 bg-white p-3 text-sm font-normal normal-case" placeholder="Produção, embalagem, contacto com o cliente…"/></label>
                        <Button type="button" className="rounded-none bg-[var(--ink)] text-white md:col-start-2" onClick={()=>void saveOrderDetails(order)}><Save/>Guardar tracking e notas</Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : section === "catalog" ? (
            <div className="mx-auto max-w-6xl space-y-6">
              <div><p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">Catálogo base</p><h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">Tipos e cores</h1><p className="mt-3 text-black/60">Estas opções são reutilizadas por todos os designs da loja.</p></div>
              <section id="catalog-colors" className="scroll-mt-20 bg-white p-6">
                <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-black uppercase">Gestor de cores</h2><p className="mt-1 text-sm text-black/50">Desativa cores sazonais sem apagar produtos.</p></div><Button variant="outline" className="rounded-none" onClick={() => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors: [...settings.productCatalog.colors, { id: `cor-${Date.now()}`, name: "Nova cor", hex: "#cccccc", active: true }] } })}><Plus />Nova cor</Button></div>
                <div className="mt-5 max-w-2xl space-y-2">
                  {settings.productCatalog.colors.map((color, index) => <div key={color.id} draggable onDragStart={() => setDraggedColorId(color.id)} onDragEnd={() => setDraggedColorId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!draggedColorId || draggedColorId === color.id) return; const colors = [...settings.productCatalog.colors]; const from = colors.findIndex((item) => item.id === draggedColorId); const [moved] = colors.splice(from, 1); colors.splice(index, 0, moved); setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors } }); setDraggedColorId(null); }} className={`grid cursor-grab grid-cols-[28px_42px_1fr_44px_44px] items-center gap-2 rounded-full border px-3 py-2 ${draggedColorId === color.id ? "border-[var(--brand)] opacity-50" : "border-black/10"}`}><GripVertical className="size-4 text-black/35" /><input type="color" value={color.hex} onChange={(event) => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors: settings.productCatalog.colors.map((item, i) => i === index ? { ...item, hex: event.target.value } : item) } })} className="h-9 w-9 rounded-full" /><Input value={color.name} onChange={(event) => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors: settings.productCatalog.colors.map((item, i) => i === index ? { ...item, name: event.target.value } : item) } })} className="rounded-full border-0 bg-transparent shadow-none" /><Button type="button" size="icon" variant="ghost" title="Configurar disponibilidade" onClick={()=>setColorConfigId(color.id)}><Settings className="size-4"/></Button><Switch checked={color.active} onCheckedChange={(active) => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, colors: settings.productCatalog.colors.map((item, i) => i === index ? { ...item, active } : item) } })} /></div>)}
                </div>
                {colorConfigId&&(()=>{const color=settings.productCatalog.colors.find((item)=>item.id===colorConfigId);if(!color)return null;const update=(supportIndex:number,patch:Partial<ProductSupport>)=>setSettings({...settings,productCatalog:{...settings.productCatalog,supports:settings.productCatalog.supports.map((item,index)=>index===supportIndex?normalizeSupport({...item,...patch}):item)}});return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-5" onMouseDown={(event)=>event.target===event.currentTarget&&setColorConfigId(null)}><div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto bg-[#f3f3ef] p-6 shadow-2xl"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="size-9 rounded-full border" style={{backgroundColor:color.hex}}/><div><h3 className="text-2xl font-black uppercase">{color.name}</h3><p className="text-sm text-black/50">Disponibilidade por produto e tamanho</p></div></div><Button type="button" variant="ghost" onClick={()=>setColorConfigId(null)}>Fechar</Button></div><div className="mt-6 grid gap-4 md:grid-cols-2">{settings.productCatalog.supports.map(normalizeSupport).map((support,supportIndex)=>{const enabled=support.colorIds.includes(color.id);const selected=support.availability[color.id]??[];return <section key={support.id} className={`bg-white p-5 ${enabled?"":"opacity-60"}`}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#e9e9e4]"><SupportIcon supportId={support.id} size={28}/></span><strong className="flex-1 uppercase">{support.name}</strong><Switch checked={enabled} onCheckedChange={(checked)=>update(supportIndex,{colorIds:checked?[...support.colorIds,color.id]:support.colorIds.filter((id)=>id!==color.id),availability:{...support.availability,[color.id]:checked?[...support.sizes]:[]}})}/></div>{enabled&&(support.variantMode==="none"?<p className="mt-4 text-sm font-bold text-black/50">Sem tamanhos · Tote Denim</p>:<div className="mt-4 grid gap-4 sm:grid-cols-2">{[{label:"Kids",sizes:KIDS_SIZES},{label:"Adult",sizes:ADULT_SIZES}].map((group)=><div key={group.label}><p className="mb-2 text-xs font-black uppercase">{group.label}</p><div className="flex flex-wrap gap-2">{group.sizes.filter((size)=>support.sizes.includes(size)).map((size)=>{const active=selected.includes(size);return <button key={size} type="button" onClick={()=>update(supportIndex,{availability:{...support.availability,[color.id]:active?selected.filter((item)=>item!==size):[...selected,size]}})} className={`rounded-full border px-3 py-2 text-xs font-black ${active?"border-black bg-black text-white":"border-black/15"}`}>{size}</button>})}</div></div>)}</div>)}</section>})}</div><div className="mt-5 flex justify-end"><Button type="button" className="rounded-none bg-[var(--ink)] text-white" onClick={()=>setColorConfigId(null)}>Concluído</Button></div></div></div>})()}
              </section>
              <section id="catalog-supports" className="scroll-mt-20 bg-white p-6">
                <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-black uppercase">Tipos de produto</h2><p className="mt-1 text-sm text-black/50">Cada categoria mostra apenas as opções que fazem sentido.</p></div><Button variant="outline" className="rounded-none" onClick={() => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, supports: [...settings.productCatalog.supports, normalizeSupport({ id: `suporte-${Date.now()}`, name: "Novo suporte", categoryId: "apparel", variantMode: "size", colorIds: [] })] } })}><Plus />Novo tipo</Button></div>
                <div className="mt-6 space-y-8">{CATALOG_CATEGORIES.map((category) => <div key={category.id}><h3 className="mb-3 text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">{category.name}</h3><div className="space-y-3">{settings.productCatalog.supports.map(normalizeSupport).map((support, supportIndex) => ({ support, supportIndex })).filter(({ support }) => support.categoryId === category.id).map(({ support, supportIndex }) => {
                  const updateSupport = (patch: Partial<ProductSupport>) => setSettings({ ...settings, productCatalog: { ...settings.productCatalog, supports: settings.productCatalog.supports.map((item, i) => i === supportIndex ? normalizeSupport({ ...support, ...patch }) : item) } });
                  const activeColors = settings.productCatalog.colors.filter((color) => color.active);
                  const optionPool = support.variantMode === "size" ? CATALOG_SIZES.filter((item) => item !== "Único") : [];
                  const setAllColors = (enabled:boolean) => updateSupport({ colorIds: enabled ? activeColors.map((color) => color.id) : [], availability: enabled ? Object.fromEntries(activeColors.map((color) => [color.id, [...optionPool]])) : {} });
                  return <details key={support.id} className="rounded-3xl border border-black/10 p-5" open><summary className="flex cursor-pointer list-none items-center gap-3 text-xl font-black uppercase"><span className="grid size-11 place-items-center rounded-full bg-[#e9e9e4]"><SupportIcon supportId={support.id} size={30}/></span>{support.name}</summary><div className="mt-5 grid gap-6">
                    <div className="grid gap-3 md:grid-cols-[1fr_190px_160px_120px]"><Input value={support.name} onChange={(event) => updateSupport({ name: event.target.value })} /><Select value={support.categoryId} onValueChange={(value) => updateSupport({ categoryId:value as ProductSupport["categoryId"], variantMode:value === "bags" ? "none" : "size", sizes:value === "bags" ? [] : CATALOG_SIZES.filter((item)=>item!=="Único") })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATALOG_CATEGORIES.map((item)=><SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select><label className="grid gap-1 text-xs font-bold uppercase"><span>Preço base (€)</span><Input type="number" min="0" step="0.01" value={(support.priceCents/100).toFixed(2)} onChange={(event)=>updateSupport({priceCents:Math.round(Number(event.target.value)*100)})}/></label><label className="flex items-center gap-2 text-sm font-bold"><Switch checked={support.active} onCheckedChange={(active) => updateSupport({ active })} />Ativo</label></div>
                    <div className="mim-support-placement rounded-2xl border border-black/10 p-3 sm:p-4"><div className="mb-4"><p className="text-xs font-black uppercase">Placement padrão do design</p><p className="mt-1 text-sm text-black/50">Arrasta o quadrado sobre o produto. Este placement é aplicado a todos os designs, salvo exceções configuradas no próprio produto.</p></div><div className="grid min-w-0 gap-5 md:grid-cols-[minmax(220px,320px)_minmax(0,1fr)] md:items-start"><DefaultPlacementControl support={support} onChange={(defaultPlacement)=>updateSupport({defaultPlacement})}/><div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-2">{([['x','Esquerda (%)'],['y','Topo (%)'],['width','Largura (%)'],['height','Altura (%)']] as const).map(([key,label])=><label key={key} className="grid min-w-0 gap-1 text-xs font-bold uppercase"><span>{label}</span><Input type="number" min="0" max="100" value={support.defaultPlacement[key]} onChange={(event)=>updateSupport({defaultPlacement:{...support.defaultPlacement,[key]:Number(event.target.value)}})}/></label>)}</div></div></div>
                    <div className="grid gap-4 rounded-2xl bg-[#f5f5f2] p-4 md:grid-cols-[1fr_180px]">
                      <div><p className="text-xs font-black uppercase">Template único para todas as cores</p><p className="mt-1 text-sm text-black/50">PNG branco/cinza com fundo transparente. A loja aplica a cor sem carregar outra fotografia.</p><Input className="mt-3" value={support.templateImage} onChange={(event) => updateSupport({ templateImage: event.target.value })} placeholder="/mockup-templates/tshirt-neutral-v1.png" />{settings.media.some((item) => item.kind === "base" && item.url) && <div className="mt-2 flex flex-wrap gap-2">{settings.media.filter((item) => item.kind === "base" && item.url).map((item) => <Button key={item.url} type="button" size="sm" variant="outline" onClick={() => updateSupport({ templateImage: item.url })}>{item.alt || "Usar template"}</Button>)}</div>}</div>
                      <div className="relative aspect-square overflow-hidden bg-white">{support.templateImage ? <Image src={support.templateImage} alt="Template neutro" fill sizes="180px" unoptimized className="object-contain p-3" /> : <span className="grid h-full place-items-center p-4 text-center text-xs font-bold text-black/35">Sem template — será usado o mockup SVG</span>}</div>
                    </div>
                    {support.variantMode === "none" ? <p className="rounded-2xl bg-[#f5f5f2] p-4 text-sm font-bold">Sem tamanho — o cliente escolhe apenas a cor.</p> : <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black uppercase">Tamanhos base</p><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => updateSupport({ sizes:[...optionPool], availability:Object.fromEntries(support.colorIds.map((id)=>[id,[...optionPool]])) })}>Selecionar tudo</Button><Button type="button" size="sm" variant="ghost" onClick={() => updateSupport({ sizes:[], availability:Object.fromEntries(support.colorIds.map((id)=>[id,[]])) })}>Limpar tudo</Button></div></div><div className="grid gap-3 sm:grid-cols-2">{[{label:"Kids",values:KIDS_SIZES},{label:"Adults",values:ADULT_SIZES}].map((group)=><div key={group.label} className="rounded-2xl border border-black/10 p-4"><p className="mb-3 text-xs font-black uppercase">{group.label}</p><div className="flex flex-wrap gap-2">{group.values.map((option)=>{const enabled=support.sizes.includes(option);return <button key={option} type="button" onClick={()=>updateSupport({sizes:enabled?support.sizes.filter((item)=>item!==option):[...support.sizes,option],availability:enabled?Object.fromEntries(Object.entries(support.availability).map(([colorId,options])=>[colorId,options.filter((item)=>item!==option)])):support.availability})} className={`rounded-full border px-4 py-2 text-sm font-black ${enabled?"border-[var(--brand)] bg-[var(--brand)] text-white":"border-black/15"}`}>{option}</button>})}</div></div>)}</div></div>}
                    <div className="min-w-0"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-black uppercase">Cores e disponibilidade</p><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={()=>setAllColors(true)}>Selecionar tudo</Button><Button type="button" size="sm" variant="ghost" onClick={()=>setAllColors(false)}>Limpar tudo</Button></div></div><div className="mim-support-colours flex min-w-0 flex-wrap gap-2">{activeColors.map((color) => { const enabled=support.colorIds.includes(color.id); const availableOptions=support.availability[color.id] ?? []; return <details key={color.id} className={`group/color min-w-0 rounded-2xl border open:basis-full ${enabled ? "border-black/20" : "border-black/10 opacity-60"}`}><summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden"><span onClick={(event)=>event.stopPropagation()}><Switch checked={enabled} onCheckedChange={(checked)=>updateSupport({ colorIds:checked ? [...support.colorIds,color.id] : support.colorIds.filter((id)=>id!==color.id), availability:{...support.availability,[color.id]:checked?[...support.sizes]:[]} })}/></span><span className="size-5 shrink-0 rounded-full border border-black/10" style={{backgroundColor:color.hex}}/><strong className="whitespace-nowrap text-xs sm:text-sm">{color.name}</strong></summary><div className="border-t border-black/10 p-3">{!enabled ? <p className="text-xs font-bold text-black/45">Ativa esta cor para gerir a disponibilidade.</p> : support.variantMode === "none" ? <p className="text-xs font-bold text-black/45">Este suporte não tem tamanhos.</p> : <div className="flex flex-wrap gap-2">{support.sizes.map((option)=>{const selected=availableOptions.includes(option);return <button key={option} type="button" onClick={()=>updateSupport({availability:{...support.availability,[color.id]:selected?availableOptions.filter((item)=>item!==option):[...availableOptions,option]}})} className={`rounded-full border px-3 py-1 text-xs font-bold ${selected?"border-[var(--ink)] bg-[var(--ink)] text-white":"border-black/15"}`}>{option}</button>})}</div>}</div></details>})}</div><details className="mt-4 text-sm"><summary className="cursor-pointer font-bold text-black/45">Mockups individuais antigos (fallback)</summary><div className="mt-3 grid min-w-0 gap-2">{activeColors.filter((color)=>support.colorIds.includes(color.id)).map((color)=><label key={color.id} className="grid min-w-0 gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center"><span>{color.name}</span><Input className="min-w-0" value={support.mockups[color.id]??""} onChange={(event)=>updateSupport({mockups:{...support.mockups,[color.id]:event.target.value}})} placeholder="Foto específica opcional"/></label>)}</div></details></div>
                  </div></details>;
                })}</div></div>)}</div>
              </section>
            </div>
          ) : section === "blog" ? (
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">Conteúdo editorial</p><h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">Blog</h1><p className="mt-3 max-w-2xl text-black/60">Histórias, internet gems, cultura local e artigos feitos pela Made in Maia. Os conteúdos começam como rascunho e só aparecem publicamente depois de os publicares.</p></div><Button type="button" className="rounded-none bg-[var(--ink)] text-white" onClick={addBlogPost}><Plus/>Novo artigo</Button></div>
              <div className="grid gap-4 md:grid-cols-2">{pageList.filter((page)=>page.slug.startsWith("blog-")).map((page)=>{const hero=page.blocks[0];return <article key={page.slug} className="border border-black/10 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${page.status==="published"?"bg-green-100 text-green-800":"bg-black/5 text-black/50"}`}>{page.status==="published"?"Publicado":"Rascunho"}</span><h2 className="mt-4 text-2xl font-black uppercase tracking-[-.04em]">{page.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-relaxed text-black/55">{hero?.description||"Sem resumo."}</p><p className="mt-4 font-mono text-xs text-black/35">/blog/{page.slug.slice(5)}</p></div><BookOpen className="size-6 shrink-0 text-[var(--brand)]"/></div><div className="mt-5 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={()=>{selectPage(page.slug);setSection("pages")}}>Editar</Button>{page.status==="published"&&<Button type="button" size="sm" variant="ghost" asChild><Link href={`/blog/${page.slug.slice(5)}`} target="_blank"><Eye/>Ver artigo</Link></Button>}</div></article>})}{!pageList.some((page)=>page.slug.startsWith("blog-"))&&<div className="col-span-full border-2 border-dashed border-black/15 bg-white/50 p-12 text-center"><BookOpen className="mx-auto size-10 text-black/25"/><h2 className="mt-4 text-2xl font-black uppercase">O journal começa aqui.</h2><p className="mt-2 text-black/50">Cria o primeiro artigo ou, mais tarde, pede ao agente editorial para preparar um rascunho.</p><Button type="button" className="mt-6 rounded-none" onClick={addBlogPost}><Plus/>Criar primeiro artigo</Button></div>}</div>
            </div>
          ) : section === "media" ? (
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.15em] text-[var(--brand)]">Conteúdos</p>
                  <h1 className="mt-2 text-5xl font-black uppercase tracking-[-.055em]">Biblioteca de media</h1>
                  <p className="mt-3 text-black/60">{settings.media.length} ficheiros indexados. As imagens dos produtos e respetivas fotografias são sincronizadas automaticamente.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 bg-[var(--ink)] px-5 text-sm font-medium text-white">
                    <input type="file" multiple accept="image/png,image/webp,image/jpeg" className="sr-only" disabled={uploading} onChange={(event) => { const files = Array.from(event.target.files ?? []); if (files.length) void Promise.all(files.map((file) => uploadMedia(file))); event.target.value = ""; }} />
                    {uploading ? "A carregar…" : "Carregar imagens"}
                  </label>
                  <Button variant="outline" className="rounded-none" onClick={() => setSettings({ ...settings, media: [...settings.media, { url: "", alt: "", kind: "artwork" }] })}><Plus />Adicionar URL</Button>
                </div>
              </div>
              <div className="mb-5 grid gap-3 bg-white p-4 md:grid-cols-[1fr_auto]">
                <Input value={mediaQuery} onChange={(event) => {setMediaQuery(event.target.value);setMediaPage(1);}} placeholder="Pesquisar por nome ou URL…" />
                <div className="flex flex-wrap gap-2">
                  {(["all", "artwork", "lifestyle", "base"] as const).map((filter) => <Button key={filter} type="button" size="sm" variant={mediaFilter === filter ? "default" : "outline"} onClick={() => {setMediaFilter(filter);setMediaPage(1);}}>{filter === "all" ? "Tudo" : filter === "artwork" ? "Designs" : filter === "lifestyle" ? "Moda" : "Peças base"}</Button>)}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pagedMedia.map(({ item, index }) => (
                  <article key={`${item.url}-${index}`} className="bg-white p-4">
                    <div className="relative mb-4 aspect-square overflow-hidden bg-[#11110f]">
                      {item.url ? <Image src={item.url} alt={item.alt || "Media"} fill sizes="(min-width: 1024px) 30vw, 50vw" unoptimized className="object-contain p-4" /> : <span className="grid h-full place-items-center text-sm text-black/40">Sem imagem</span>}
                    </div>
                    <div className="grid gap-2">
                      <Input value={item.url} onChange={(event) => setSettings({ ...settings, media: settings.media.map((entry, i) => i === index ? { ...entry, url: event.target.value } : entry) })} placeholder="https://..." />
                      <Input value={item.alt} onChange={(event) => setSettings({ ...settings, media: settings.media.map((entry, i) => i === index ? { ...entry, alt: event.target.value } : entry) })} placeholder="Nome do design" />
                      <Select value={item.kind ?? "artwork"} onValueChange={(kind) => setSettings({ ...settings, media: settings.media.map((entry, i) => i === index ? { ...entry, kind: kind as "artwork" | "lifestyle" | "base" } : entry) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="artwork">Design transparente</SelectItem><SelectItem value="lifestyle">Fotografia de moda</SelectItem><SelectItem value="base">Peça sem design</SelectItem></SelectContent></Select>
                      {item.productSlug ? <p className="rounded-lg bg-black/[.04] px-3 py-2 text-xs font-bold">Ligada a <span className="uppercase">{item.productSlug}</span> · {item.role === "gallery" ? "galeria" : "capa"}</p> : <Button variant="ghost" className="justify-start rounded-none text-red-600" onClick={() => setSettings({ ...settings, media: settings.media.filter((_, i) => i !== index) })}><Trash2 />Remover da biblioteca</Button>}
                    </div>
                  </article>
                ))}
                {!settings.media.length && <div className="col-span-full border-2 border-dashed border-black/15 bg-white/50 p-12 text-center"><Images className="mx-auto size-10 text-black/30" /><p className="mt-4 font-bold">Ainda não há imagens.</p><p className="mt-1 text-sm text-black/50">Carrega o primeiro PNG, JPG ou WebP para a biblioteca local.</p></div>}
              </div>
              {filteredMedia.length>0&&<div className="mt-5 flex items-center justify-between bg-white p-4"><span className="text-sm font-bold">{(currentMediaPage-1)*12+1}–{Math.min(currentMediaPage*12,filteredMedia.length)} de {filteredMedia.length}</span><div className="flex gap-2"><Button type="button" variant="outline" disabled={currentMediaPage===1} onClick={()=>setMediaPage((page)=>Math.max(1,page-1))}>Anterior</Button><span className="grid min-w-12 place-items-center text-sm font-black">{currentMediaPage}/{mediaPageCount}</span><Button type="button" variant="outline" disabled={currentMediaPage===mediaPageCount} onClick={()=>setMediaPage((page)=>Math.min(mediaPageCount,page+1))}>Seguinte</Button></div></div>}
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
                  Marca, SEO, contactos, splash screen, tema e páginas legais.
                </p>
              </div>
              <div id="settings-general" className="grid scroll-mt-20 gap-5 lg:grid-cols-2">
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
              <section id="settings-splash" className="mt-5 scroll-mt-20 bg-[var(--ink)] p-6 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black uppercase">Splash screen</h2>
                    <p className="mt-1 text-sm text-white/55">Controla a página temporária apresentada em madeinmaia.pt.</p>
                  </div>
                  <label className="flex items-center gap-3 text-sm font-bold uppercase"><Switch checked={settings.launchSplash.enabled} onCheckedChange={(enabled) => setSettings({ ...settings, launchSplash: { ...settings.launchSplash, enabled } })} />{settings.launchSplash.enabled ? "Ativo" : "Loja ativa"}</label>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-xs font-bold uppercase"><span>Antetítulo</span><Input className="bg-white text-[var(--ink)]" value={settings.launchSplash.eyebrow} onChange={(event) => setSettings({ ...settings, launchSplash: { ...settings.launchSplash, eyebrow: event.target.value } })} /></label>
                  <label className="grid gap-2 text-xs font-bold uppercase"><span>Texto do shoulder tag</span><Input className="bg-white text-[var(--ink)]" value={settings.launchSplash.shoulderTagLabel} onChange={(event) => setSettings({ ...settings, launchSplash: { ...settings.launchSplash, shoulderTagLabel: event.target.value } })} /></label>
                  <label className="grid gap-2 text-xs font-bold uppercase"><span>Título</span><textarea className="min-h-24 border border-white/20 bg-white p-3 text-2xl font-black uppercase text-[var(--ink)]" value={settings.launchSplash.title} onChange={(event) => setSettings({ ...settings, launchSplash: { ...settings.launchSplash, title: event.target.value } })} /></label>
                  <label className="grid gap-2 text-xs font-bold uppercase"><span>Descrição</span><textarea className="min-h-24 border border-white/20 bg-white p-3 text-[var(--ink)]" value={settings.launchSplash.description} onChange={(event) => setSettings({ ...settings, launchSplash: { ...settings.launchSplash, description: event.target.value } })} /></label>
                </div>
                <div className="mt-5 border border-white/15 bg-black/20 p-5">
                  <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--accent-brand)]">{settings.launchSplash.eyebrow}</p>
                  <p className="mt-2 whitespace-pre-line text-5xl font-black uppercase leading-[.8] tracking-[-.06em]">{settings.launchSplash.title}</p>
                  <p className="mt-4 max-w-xl text-sm text-white/60">{settings.launchSplash.description}</p>
                </div>
              </section>
              <section id="settings-theme" className="mt-5 scroll-mt-20 bg-white p-6">
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
              <CssStudio files={settings.cssFiles} onChange={(cssFiles)=>setSettings({...settings,cssFiles})}/>
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
                        seoTitle: "",
                        seoDescription: "",
                        seoCanonical: "",
                        seoNoIndex: false,
                        imageKey: "",
                        gallery: [],
                        disabledSupports: [],
                        artworkPlacements: {},
                        colors: ["Branco"],
                        previewColorIds: [],
                        sizes: ["S", "M", "L"],
                        variants: [],
                        sortOrder: 0,
                        monochrome: false,
                        onlineSaleEnabled: true,
                        salesRank: 0,
                        status: "draft",
                        detailsLoaded: true,
                      },
                      ...items,
                    ]);
                    setExpandedProductId(id);
                  }}
                  className="mim-new-product-button rounded-none !bg-[#ff4f1f] !text-white hover:!bg-[#e83f12]"
                >
                  <Plus />
                  Novo produto
                </Button>
              </div>
              <label className="mim-studio-product-search mb-5 flex h-12 w-full min-w-0 items-center gap-3 border border-black/10 bg-white px-4 shadow-sm focus-within:border-black/35">
                <Search className="size-5 shrink-0 text-black/40" />
                <span className="sr-only">Pesquisar produtos</span>
                <input value={productQuery} onChange={(event)=>setProductQuery(event.target.value)} placeholder="Pesquisar por nome, MiM_0000, slug, coleção ou tag…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35" />
                {productQuery && <button type="button" className="shrink-0 text-xs font-black uppercase text-black/45 hover:text-black" onClick={()=>setProductQuery("")}>Limpar</button>}
              </label>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex border border-white/15 bg-white/5 p-1" aria-label="Filtrar produtos por estado">
                  {([['all','Todos'],['active','Ativos'],['disabled','Desativados']] as const).map(([value,label])=><button key={value} type="button" aria-pressed={productStatusFilter===value} onClick={()=>setProductStatusFilter(value)} className={`px-4 py-2 text-xs font-black uppercase transition ${productStatusFilter===value?'bg-[var(--brand)] text-white':'text-white/60 hover:text-white'}`}>{label}<span className="ml-1.5 opacity-70">{value==='all'?catalogue.length:value==='active'?catalogue.filter((item)=>item.status==='published').length:catalogue.filter((item)=>item.status!=='published').length}</span></button>)}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold uppercase text-white/60">
                  <span>{selectedProductIds.size} selecionado{selectedProductIds.size===1?'':'s'}</span>
                  {selectedProductIds.size>0&&<button type="button" className="text-white underline underline-offset-4" onClick={()=>setSelectedProductIds(new Set())}>Desselecionar todos</button>}
                </div>
              </div>
              <div className="space-y-3">
                {filteredCatalogue.map((product) => {
                  const productIndex = catalogue.findIndex((item)=>item.id===product.id);
                  const isOpen = expandedProductId === product.id;
                  return (
                    <article key={product.id} draggable onDragStart={() => startProductDrag(product.id)} onDragEnd={() => setDraggedProductId(null)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); dropProduct(product.id); }} className={`overflow-hidden border bg-white shadow-sm transition ${draggedProductId !== null && selectedProductIds.has(product.id) ? "opacity-55" : ""} ${selectedProductIds.has(product.id) ? "border-[var(--brand)] outline outline-2 outline-[var(--brand)]" : "border-black/10"}`}>
                      <div className="grid grid-cols-[24px_24px_64px_minmax(0,1fr)] items-center gap-2.5 p-3 sm:grid-cols-[28px_28px_72px_minmax(0,1fr)] sm:gap-3">
                        <button type="button" aria-label={selectedProductIds.has(product.id)?`Desselecionar ${product.name}`:`Selecionar ${product.name}`} aria-pressed={selectedProductIds.has(product.id)} onClick={()=>toggleProductSelection(product.id)} className={`row-span-2 grid size-6 place-items-center border text-xs font-black transition ${selectedProductIds.has(product.id)?'border-[var(--brand)] bg-[var(--brand)] text-white':'border-black/20 bg-white text-transparent hover:border-black/50'}`}>✓</button>
                        <GripVertical className="row-span-2 size-5 cursor-grab text-black/30 active:cursor-grabbing" aria-label="Arrastar para reordenar" />
                        <button type="button" onClick={() => void openProduct(product)} className="mim-studio-product-thumb relative row-span-2 size-16 overflow-hidden border border-black/10 sm:size-[72px]">
                          {product.imageKey ? <Image src={product.imageKey} alt="" fill sizes="64px" unoptimized className="object-contain p-1" /> : <Images className="absolute inset-0 m-auto size-5 text-black/25" />}
                        </button>
                        <button type="button" onClick={() => void openProduct(product)} className="flex min-w-0 items-baseline gap-2 self-end text-left">
                          <span className="shrink-0 font-mono text-[11px] font-black uppercase text-black/45 sm:text-xs">{product.designCode || "MiM_0000"}</span>
                          <strong className="min-w-0 truncate text-sm sm:text-lg">{product.name}</strong>
                        </button>
                        <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 self-start sm:gap-x-3">
                          <div className="flex items-center gap-0.5"><Button type="button" variant="ghost" size="icon" className="size-8" disabled={productIndex === 0} onClick={() => moveProduct(product.id, -1)} aria-label="Subir produto"><ArrowUp className="size-4" /></Button><Button type="button" variant="ghost" size="icon" className="size-8" disabled={productIndex === catalogue.length - 1} onClick={() => moveProduct(product.id, 1)} aria-label="Descer produto"><ArrowDown className="size-4" /></Button></div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => void editProductPlacement(product)} aria-label="Posicionar design" title="Posicionar design"><Move className="size-4" /></Button>
                          <label title="Design monocromático" className="flex items-center gap-2 text-xs font-bold uppercase"><Contrast className="size-4" aria-hidden/><Switch aria-label="Design monocromático" checked={product.monochrome} onCheckedChange={(checked) => void updateProductMonochrome(product, checked)} /><span className="hidden xl:inline">Mono</span></label>
                          <label title="Disponível na loja online / dados Dash" className="flex items-center gap-2 text-xs font-bold uppercase"><BarChart3 className="size-4" aria-hidden/><Switch aria-label="Disponível online" checked={product.onlineSaleEnabled} onCheckedChange={(checked) => void updateProductOnlineSale(product, checked)} /><span className="hidden xl:inline">Online</span></label>
                          <label title={product.status === "published" ? "Produto ativo" : "Produto desativado"} className="flex items-center gap-2 text-xs font-bold uppercase"><CirclePower className="size-4" aria-hidden/><Switch aria-label="Produto ativo" checked={product.status === "published"} onCheckedChange={(checked) => void updateProductStatus(product, checked)} /><span className="hidden sm:inline">{product.status === "published" ? "Ativo" : "Inativo"}</span></label>
                          <Button type="button" variant="ghost" size="icon" className="ml-auto size-8" onClick={() => void openProduct(product)} aria-label={isOpen ? "Fechar produto" : "Abrir produto"}><span className={`text-xl transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span></Button>
                        </div>
                      </div>
                      {isOpen && product.detailsLoaded && (
                        <div className="min-w-0 border-t border-black/10 p-5">
                          <div className="grid min-w-0 gap-6">
                            <div className="grid min-w-0 content-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                              <label className="grid gap-1 text-xs font-bold uppercase"><span>Número do design</span><Input value={product.designCode} onChange={(event) => updateProduct(product.id, { designCode: event.target.value })} onBlur={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(-4); updateProduct(product.id, { designCode: `MiM_${digits.padStart(4, "0")}` }); }} placeholder="MiM_0000" /></label>
                              <label className="grid gap-1 text-xs font-bold uppercase"><span>Nome</span><Input value={product.name} onChange={(event) => updateProduct(product.id, { name: event.target.value })} /></label>
                              <label className="grid gap-1 text-xs font-bold uppercase"><span>Slug</span><Input value={product.slug} onChange={(event) => updateProduct(product.id, { slug: event.target.value })} /></label>
                              <label className="grid gap-1 text-xs font-bold uppercase md:col-span-2 xl:col-span-3"><span>Descrição do produto</span><textarea rows={3} value={product.description} onChange={(event)=>updateProduct(product.id,{description:event.target.value})} className="min-h-24 w-full resize-y border border-black/15 bg-white px-3 py-2 text-sm font-normal normal-case outline-none transition focus:border-[var(--brand)]" placeholder="Descrição visível na página do produto e usada como fallback de SEO."/></label>
                              <label className="grid gap-1 text-xs font-bold uppercase"><span>Preço (€)</span><Input type="number" min="0" step="0.01" value={(product.priceCents / 100).toFixed(2)} onChange={(event) => updateProduct(product.id, { priceCents: Math.round(Number(event.target.value) * 100) })} /></label>
                              <label className="grid gap-1 text-xs font-bold uppercase"><span>Ranking de vendas</span><Input type="number" min="0" step="1" value={product.salesRank} onChange={(event) => updateProduct(product.id, { salesRank: Math.max(0, Number(event.target.value) || 0) })} /></label>
                              <div className="grid gap-2 text-xs font-bold uppercase md:col-span-2 xl:col-span-3"><span>Tags de pesquisa</span><div className="flex min-h-10 flex-wrap items-center gap-2">{product.tags.map((tag,index)=><span key={`${product.id}-tag-${index}`} className="inline-flex h-8 items-center rounded-full border border-black/15 bg-black/[.035] pl-3 pr-1 normal-case"><input aria-label={`Editar tag ${tag||index+1}`} value={tag} placeholder="tag" autoFocus={index===product.tags.length-1&&tag===""} size={Math.max(4,Math.min(16,tag.length||3))} onChange={(event)=>{const tags=[...product.tags];tags[index]=event.target.value;updateProduct(product.id,{tags});}} onBlur={()=>updateProduct(product.id,{tags:product.tags.map((item)=>item.trim()).filter(Boolean)})} className="min-w-10 max-w-36 bg-transparent text-xs font-bold outline-none"/><button type="button" aria-label={`Remover tag ${tag||index+1}`} onClick={()=>updateProduct(product.id,{tags:product.tags.filter((_,itemIndex)=>itemIndex!==index)})} className="grid size-6 place-items-center rounded-full text-base leading-none text-black/40 transition hover:bg-black/10 hover:text-black">×</button></span>)}<button type="button" onClick={()=>updateProduct(product.id,{tags:[...product.tags,""]})} className="grid size-8 place-items-center rounded-full border border-dashed border-black/25 text-lg text-black/50 transition hover:border-[var(--brand)] hover:text-[var(--brand)]" aria-label="Adicionar tag"><Plus className="size-4"/></button></div></div>
                              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-black/10 bg-[#f7f7f4] p-4 md:col-span-2 xl:col-span-3">
                                <span><strong className="block text-sm uppercase">Design monocromático</strong><span className="mt-1 block text-xs font-normal text-black/50">Ativa a escolha de impressão preta ou branca e o filtro CSS do design. Mantém desligado para preservar todas as cores do PNG.</span></span>
                                <Switch aria-label="Design monocromático" checked={product.monochrome} onCheckedChange={(checked) => void updateProductMonochrome(product, checked)} />
                              </label>
                            </div>
                            <div className="grid min-w-0 gap-6 md:grid-cols-2 md:items-start">
                              <section className="min-w-0 md:row-span-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <div><p className="text-xs font-bold uppercase">Imagem de capa</p><p className="text-xs text-black/45">Apenas PNG com fundo transparente · otimização automática</p></div>
                                  {product.imageKey && <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => updateProduct(product.id, { imageKey: "" })}><Trash2 />Remover</Button>}
                                </div>
                                {product.imageKey ? (
                                  <div className="mim-product-artwork-preview relative aspect-square w-full overflow-hidden border-2 border-black/10">
                                    <Image src={product.imageKey} alt={product.name} fill sizes="360px" unoptimized className="object-contain p-5" />
                                  </div>
                                ) : (
                                  <label
                                    className={`group grid aspect-square w-full cursor-pointer place-items-center overflow-hidden border-2 border-dashed text-center transition ${productImageDragOver === product.id ? "border-[var(--brand)] bg-orange-50" : "border-black/20 bg-black/[.025] hover:border-[var(--brand)] hover:bg-orange-50/50"}`}
                                    onDragEnter={(event) => { event.preventDefault(); setProductImageDragOver(product.id); }}
                                    onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setProductImageDragOver(product.id); }}
                                    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setProductImageDragOver(null); }}
                                    onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void uploadProductArtwork(product.id, file); }}
                                  >
                                    <input type="file" accept="image/png,.png" className="sr-only" disabled={productImageUploading === product.id} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadProductArtwork(product.id, file); event.target.value = ""; }} />
                                    <span className="px-8">
                                      <UploadCloud className="mx-auto size-11 text-black/25 transition group-hover:text-[var(--brand)]" />
                                      <strong className="mt-4 block text-sm uppercase">{productImageUploading === product.id ? "A otimizar e carregar…" : "Larga aqui o PNG"}</strong>
                                      <span className="mt-2 block text-xs text-black/45">ou clica para escolher · máximo 10 MB</span>
                                    </span>
                                  </label>
                                )}
                                {product.imageKey && <label className={`mt-3 flex min-h-16 cursor-pointer items-center justify-center gap-3 border-2 border-dashed px-4 text-center transition ${productImageDragOver===product.id?"border-[var(--brand)] bg-orange-50":"border-black/20 hover:border-[var(--brand)]"}`} onDragEnter={(event)=>{event.preventDefault();setProductImageDragOver(product.id)}} onDragOver={(event)=>{event.preventDefault();event.dataTransfer.dropEffect="copy";setProductImageDragOver(product.id)}} onDragLeave={(event)=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setProductImageDragOver(null)}} onDrop={(event)=>{event.preventDefault();const file=event.dataTransfer.files[0];if(file)void uploadProductArtwork(product.id,file)}}><input type="file" accept="image/png,.png" className="sr-only" disabled={productImageUploading===product.id} onChange={(event)=>{const file=event.target.files?.[0];if(file)void uploadProductArtwork(product.id,file);event.target.value=""}}/><UploadCloud className="size-5"/><strong className="text-xs uppercase">{productImageUploading===product.id?"A substituir…":"Substituir design PNG"}</strong></label>}
                              </section>
                              <details className="mim-product-translations rounded-2xl border border-black/10 p-4 md:col-start-1">
                                <summary className="cursor-pointer text-xs font-black uppercase">Traduções do nome</summary>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  {(["pt", "es", "de", "fr"] as const).map((locale) => (
                                    <label key={locale} className="grid min-w-0 gap-1 text-[10px] font-bold uppercase">
                                      <span>{locale}</span>
                                      <Input
                                        value={product.nameTranslations[locale] ?? ""}
                                        onChange={(event) => updateProduct(product.id, { nameTranslations: { ...product.nameTranslations, [locale]: event.target.value } })}
                                        placeholder={product.name}
                                        className="min-w-0"
                                      />
                                    </label>
                                  ))}
                                </div>
                              </details>
                              <section className="mim-product-preview-colors rounded-2xl border border-black/10 p-4 md:col-start-2 md:row-start-1">
                                <p className="text-xs font-black uppercase">Cores da preview na listagem</p>
                                <p className="mt-1 text-xs text-black/45">Escolhe até três fundos. A loja usa uma destas cores na preview.</p>
                                <div className="mt-3 flex flex-wrap gap-2">{settings.productCatalog.colors.filter((color)=>color.active).map((color)=>{const selected=product.previewColorIds.includes(color.id);return <button key={color.id} type="button" title={color.name} aria-label={color.name} aria-pressed={selected} onClick={()=>updateProduct(product.id,{previewColorIds:selected?product.previewColorIds.filter((id)=>id!==color.id):[...product.previewColorIds.slice(-2),color.id]})} className={`grid size-9 place-items-center rounded-full border-2 transition ${selected?"scale-110 border-[var(--brand)]":"border-white/20"}`}><span className="size-6 rounded-full border border-black/15" style={{backgroundColor:color.hex}}/></button>})}</div>
                              </section>
                              <section className="mim-product-supports rounded-2xl border border-black/10 p-4 md:col-start-2 md:row-start-2">
                                <p className="text-xs font-black uppercase">Suportes disponíveis</p>
                                <p className="mt-1 text-xs text-black/45">Desativa apenas as exceções deste design.</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {settings.productCatalog.supports.filter((support) => support.active).map((support) => {
                                    const enabled = !product.disabledSupports.includes(support.id);
                                    return (
                                      <label key={support.id} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f4] px-3 py-2">
                                        <span className="whitespace-nowrap text-xs font-bold">{support.name}</span>
                                        <Switch
                                          aria-label={`${support.name}: ${enabled ? "ativo" : "inativo"}`}
                                          checked={enabled}
                                          onCheckedChange={(checked) => updateProduct(product.id, { disabledSupports: checked ? product.disabledSupports.filter((id) => id !== support.id) : [...product.disabledSupports, support.id] })}
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </section>
                              <section className="mim-product-gallery-editor border-t border-black/10 pt-6 md:col-span-2"><p className="text-xs font-bold uppercase">Fotografias do produto</p><p className="mt-1 text-xs text-black/45">Fotografias com modelos, lifestyle, detalhes ou fotografia de estúdio deste produto.</p>{product.gallery.length > 0 && <div className="mt-3 grid grid-cols-2 gap-2">{product.gallery.map((photo, index) => <div key={`${photo}-${index}`} className="group relative aspect-[4/3] overflow-hidden bg-[#eee]"><Image src={photo} alt={`${product.name} · fotografia ${index + 1}`} fill sizes="180px" unoptimized className="object-cover" /><div className="absolute inset-x-1 top-1 flex justify-between gap-1 opacity-95"><div className="flex gap-1"><Button type="button" size="icon" variant="secondary" className="size-7" disabled={index===0} onClick={()=>{const gallery=[...product.gallery];[gallery[index-1],gallery[index]]=[gallery[index],gallery[index-1]];updateProduct(product.id,{gallery});}} aria-label="Mover fotografia para trás"><ArrowUp className="size-3"/></Button><Button type="button" size="icon" variant="secondary" className="size-7" disabled={index===product.gallery.length-1} onClick={()=>{const gallery=[...product.gallery];[gallery[index+1],gallery[index]]=[gallery[index],gallery[index+1]];updateProduct(product.id,{gallery});}} aria-label="Mover fotografia para a frente"><ArrowDown className="size-3"/></Button></div><Button type="button" size="icon" variant="destructive" className="size-7" onClick={() => updateProduct(product.id, { gallery: product.gallery.filter((_, itemIndex) => itemIndex !== index) })} aria-label="Remover fotografia"><Trash2 className="size-3" /></Button></div></div>)}</div>}<label className={`mt-3 grid min-h-28 cursor-pointer place-items-center border-2 border-dashed p-4 text-center transition ${galleryDragOver===product.id?"border-[var(--brand)] bg-orange-50":"border-black/20 bg-black/[.025] hover:border-[var(--brand)]"}`} onDragEnter={(event)=>{event.preventDefault();setGalleryDragOver(product.id)}} onDragOver={(event)=>{event.preventDefault();event.dataTransfer.dropEffect="copy";setGalleryDragOver(product.id)}} onDragLeave={(event)=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setGalleryDragOver(null)}} onDrop={(event)=>{event.preventDefault();void uploadProductGallery(product.id,Array.from(event.dataTransfer.files));}}><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={galleryUploading===product.id} onChange={(event)=>{void uploadProductGallery(product.id,Array.from(event.target.files??[]));event.target.value=""}}/><span><UploadCloud className="mx-auto size-8 text-black/25"/><strong className="mt-2 block text-xs uppercase">{galleryUploading===product.id?"A carregar fotografias…":"Adicionar fotografias deste produto"}</strong><span className="mt-1 block text-[11px] text-black/40">JPG, PNG ou WebP · podes selecionar várias</span></span></label></section>
                              <section className="mim-product-seo-editor space-y-4 border-t border-black/10 pt-6 md:col-span-2">
                                <div><p className="text-xs font-black uppercase">SEO do produto</p><p className="mt-1 text-xs text-black/45">Controlos essenciais ao estilo Yoast. Se deixares um campo vazio, usamos automaticamente o nome e a descrição do produto.</p></div>
                                <div className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-4"><p className="truncate text-xs text-green-700">madeinmaia.pt/designs/{product.slug}</p><p className="mt-1 line-clamp-1 text-lg text-[#1a0dab]">{product.seoTitle || product.name}</p><p className="mt-1 line-clamp-2 text-sm leading-5 text-black/60">{product.seoDescription || product.description || `${product.name}, um design original Made in Maia.`}</p></div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <label className="grid gap-1 text-xs font-bold uppercase"><span>Título SEO <small className="font-normal normal-case text-black/40">{product.seoTitle.length}/60</small></span><Input maxLength={80} value={product.seoTitle} onChange={(event)=>updateProduct(product.id,{seoTitle:event.target.value})} placeholder={product.name}/></label>
                                  <label className="grid gap-1 text-xs font-bold uppercase"><span>URL canónica</span><Input value={product.seoCanonical} onChange={(event)=>updateProduct(product.id,{seoCanonical:event.target.value})} placeholder={`https://madeinmaia.pt/designs/${product.slug}`}/></label>
                                  <label className="grid gap-1 text-xs font-bold uppercase md:col-span-2"><span>Meta descrição <small className="font-normal normal-case text-black/40">{product.seoDescription.length}/160</small></span><textarea maxLength={220} rows={3} value={product.seoDescription} onChange={(event)=>updateProduct(product.id,{seoDescription:event.target.value})} placeholder={product.description || `Descobre ${product.name}, um design original Made in Maia.`} className="min-h-24 w-full resize-y border border-black/15 bg-white px-3 py-2 text-sm font-normal normal-case outline-none transition focus:border-[var(--brand)]"/></label>
                                </div>
                                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-black/10 p-4"><span><strong className="block text-xs uppercase">Ocultar dos motores de pesquisa</strong><span className="mt-1 block text-xs font-normal text-black/45">Adiciona noindex e nofollow. Usa apenas para produtos que não devem aparecer no Google.</span></span><Switch checked={product.seoNoIndex} onCheckedChange={(checked)=>updateProduct(product.id,{seoNoIndex:checked})} aria-label="Ocultar produto dos motores de pesquisa"/></label>
                              </section>
                              <Button variant="outline" className="w-full rounded-none md:col-span-2" asChild><Link href={`/designs/${product.slug}`} target="_blank"><Eye />Ver produto</Link></Button>
                            </div>
                          </div>
                          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <Button type="button" variant="outline" className="rounded-none border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => void deleteProduct(product)}><Trash2 className="size-4" />Apagar produto</Button>
                            <Button type="button" className="rounded-none bg-[var(--ink)] text-white hover:bg-black disabled:opacity-55" disabled={savingProductId === product.id} onClick={() => void saveProduct(product)}><Save className="size-4" />{savingProductId === product.id ? "A guardar…" : "Guardar produto"}</Button>
                          </div>
                        </div>
                      )}
                      {isOpen && !product.detailsLoaded && <div className="border-t border-black/10 p-8 text-center text-sm font-bold text-black/45">A carregar produto…</div>}
                    </article>
                  );
                })}
                {filteredCatalogue.length===0&&<div className="border-2 border-dashed border-black/15 bg-white/50 p-10 text-center"><Search className="mx-auto size-8 text-black/25"/><p className="mt-3 font-black uppercase">Nenhum produto encontrado</p><button type="button" onClick={()=>{setProductQuery("");setProductStatusFilter("all");}} className="mt-2 text-sm underline">Limpar filtros</button></div>}
              </div>
              {placementProductId !== null && (()=>{const product=catalogue.find((item)=>item.id===placementProductId);return product?<ArtworkPlacementEditor open onOpenChange={(open)=>!open&&setPlacementProductId(null)} name={product.name} artwork={product.imageKey||"/products/white-shirt-1.jpg"} supports={settings.productCatalog.supports.filter((support)=>!product.disabledSupports.includes(support.id))} placements={product.artworkPlacements??{}} onSave={(placements)=>void saveProductPlacement(product,placements)}/>:null;})()}
            </div>
          )}
        </section>
        {section === "pages" ? (
          <aside className="sticky top-16 h-[calc(100vh-4rem)] self-start overflow-y-auto overscroll-contain border-l border-black/10 bg-white p-5 max-lg:hidden">
            <Tabs value={editorSidebarTab} onValueChange={(value)=>setEditorSidebarTab(value as typeof editorSidebarTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="blocks">Blocos</TabsTrigger>
                <TabsTrigger value="settings">Definições</TabsTrigger>
                <TabsTrigger value="style">Estilo</TabsTrigger>
              </TabsList>
              <TabsContent value="blocks" className="space-y-5 pt-5">
                <div><p className="text-xs font-black uppercase tracking-[.12em]">Adicionar bloco</p><p className="mt-2 text-sm text-black/55">Escolhe um tipo. Depois edita o texto diretamente no canvas.</p></div>
                <div className="grid grid-cols-2 gap-2">{([['Post Title',LayoutTemplate],['Hero',LayoutTemplate],['Produtos',ShoppingBag],['Coleções',GripVertical],['Texto',BookOpen],['Banner',Monitor],['Logo aleatório',Palette],['Linktree',Move],['Localização',Store]] as Array<[PageBlockType,typeof LayoutTemplate]>).map(([type,Icon])=><button key={type} type="button" onClick={()=>addBlock(type)} className="group grid min-h-24 place-items-center gap-2 border border-black/10 bg-black/[.025] p-3 text-center transition hover:border-[var(--brand)] hover:bg-orange-50/50"><Icon className="size-6 text-[var(--brand)]"/><span className="text-xs font-black uppercase">{type}</span></button>)}</div>
                <div className="border-t border-black/10 pt-5"><p className="flex items-center gap-2 text-sm font-semibold"><GripVertical className="size-4"/>Estrutura da página</p><ol className="mt-3 space-y-2">{blocks.map((block)=><li key={block.id} draggable onDragStart={()=>setDraggedBlockId(block.id)} onDragEnd={()=>setDraggedBlockId(null)} onDragOver={(event)=>event.preventDefault()} onDrop={()=>{if(!draggedBlockId||draggedBlockId===block.id)return;const next=[...blocks];const from=next.findIndex((item)=>item.id===draggedBlockId);const to=next.findIndex((item)=>item.id===block.id);const [moved]=next.splice(from,1);next.splice(to,0,moved);setBlocks(next);setDraggedBlockId(null)}}><button onClick={()=>{setSelected(block.id);setEditorSidebarTab("settings")}} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${selected===block.id?"bg-[var(--brand)] text-white":"bg-black/[.04]"}`}><GripVertical className="size-4 shrink-0 opacity-50"/><span className="min-w-0 truncate">{block.type} · {block.title}</span></button></li>)}</ol></div>
              </TabsContent>
              <TabsContent value="settings" className="space-y-5 pt-5">
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
                      <SelectItem value="Post Title">Post Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {current?.type === "Produtos" && <div className="mim-product-block-settings space-y-4 rounded-2xl border border-black/10 bg-[#f7f7f4] p-4">
                  <p className="text-xs font-black uppercase tracking-[.12em]">Produtos apresentados</p>
                  <label className="grid gap-1 text-sm font-semibold">Fonte<Select value={current.productSource??"all"} onValueChange={(value)=>updateBlock({productSource:value as Block["productSource"]})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos os produtos</SelectItem><SelectItem value="tag">Por tag ou coleção</SelectItem><SelectItem value="selection">Seleção manual</SelectItem></SelectContent></Select></label>
                  {current.productSource==="tag"&&<label className="grid gap-1 text-sm font-semibold">Tag ou coleção<Select value={current.productTag||undefined} onValueChange={(productTag)=>updateBlock({productTag})}><SelectTrigger><SelectValue placeholder="Escolher tag"/></SelectTrigger><SelectContent>{availableProductTags.map((tag)=><SelectItem key={tag} value={tag}>{tag}</SelectItem>)}</SelectContent></Select></label>}
                  {current.productSource==="selection"&&<div><p className="mb-2 text-sm font-semibold">Seleção manual</p><div className="max-h-52 space-y-1 overflow-y-auto border border-black/10 bg-white p-2">{catalogue.filter((product)=>product.status==="published").map((product)=>{const selected=current.productSlugs?.includes(product.slug)??false;return <label key={product.slug} className="flex cursor-pointer items-center gap-2 p-2 text-xs hover:bg-black/[.03]"><input type="checkbox" checked={selected} onChange={()=>updateBlock({productSlugs:selected?(current.productSlugs??[]).filter((slug)=>slug!==product.slug):[...(current.productSlugs??[]),product.slug]})}/><span className="font-mono text-black/40">{product.designCode}</span><span className="min-w-0 flex-1 truncate font-bold">{product.name}</span></label>})}</div></div>}
                  <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-semibold">Quantidade<Input type="number" min="1" max="64" value={current.productLimit??6} onChange={(event)=>updateBlock({productLimit:Math.min(64,Math.max(1,Number(event.target.value)||1))})}/></label><label className="grid gap-1 text-sm font-semibold">Ordem<Select value={current.productOrder??"asc"} onValueChange={(value)=>updateBlock({productOrder:value as Block["productOrder"]})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="random">Aleatória</SelectItem><SelectItem value="asc">ASC · A–Z</SelectItem><SelectItem value="desc">DESC · Z–A</SelectItem></SelectContent></Select></label></div>
                </div>}
                <div className="border border-white/10 bg-black/[.04] p-3 text-sm leading-relaxed"><strong className="block text-xs uppercase tracking-[.12em]">Conteúdo direto</strong><span className="mt-1 block text-black/55">Título, antetítulo, descrição e texto do botão são editados diretamente no bloco.</span></div>
                <div><label className="mb-2 block text-sm font-semibold">Link do botão</label><Input value={current?.ctaUrl ?? ""} onChange={(event) => updateBlock({ ctaUrl:event.target.value })}/></div>
                <div><label className="mb-2 block text-sm font-semibold">Imagem de fundo</label><Input value={current?.imageUrl ?? ""} onChange={(event)=>updateBlock({imageUrl:event.target.value})} placeholder="URL da fotografia do edifício ou banner"/></div>
                <details className="rounded-2xl border border-black/10 p-4"><summary className="cursor-pointer text-sm font-black">Traduções deste bloco</summary><div className="mt-4 space-y-4">{["pt","es","de","fr"].map((locale)=>{const translation=current?.translations?.[locale]??{};const updateTranslation=(patch:Record<string,string>)=>updateBlock({translations:{...(current?.translations??{}),[locale]:{...translation,...patch}}});return <div key={locale} className="rounded-xl bg-[#f5f5f2] p-3"><p className="mb-2 text-xs font-black uppercase">{locale}</p><div className="grid gap-2"><Input value={translation.title??""} onChange={(event)=>updateTranslation({title:event.target.value})} placeholder="Título"/><textarea value={translation.description??""} onChange={(event)=>updateTranslation({description:event.target.value})} placeholder="Descrição" className="min-h-20 border border-input bg-white p-3"/></div></div>})}</div></details>
                <Button
                  onClick={()=>addBlock()}
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
                {current?.type==="Post Title"&&<div className="space-y-4 border-b border-white/10 pb-5"><p className="text-xs font-black uppercase tracking-[.12em]">Typography</p><label className="grid gap-1 text-sm font-semibold">HTML tag<Select value={current.headingTag??"h1"} onValueChange={(headingTag)=>updateBlock({headingTag:headingTag as Block["headingTag"]})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["h1","h2","h3","h4","h5","h6","div","p","span"].map((tag)=><SelectItem key={tag} value={tag}>{tag.toUpperCase()}</SelectItem>)}</SelectContent></Select></label><div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-semibold">Size (px)<Input type="number" min="12" max="180" value={current.fontSize??64} onChange={(event)=>updateBlock({fontSize:Number(event.target.value)})}/></label><label className="grid gap-1 text-sm font-semibold">Weight<Input type="number" min="100" max="900" step="100" value={current.fontWeight??900} onChange={(event)=>updateBlock({fontWeight:Number(event.target.value)})}/></label></div><label className="grid gap-1 text-sm font-semibold">Letter spacing (px)<Input type="number" min="-10" max="30" step=".5" value={current.letterSpacing??-2} onChange={(event)=>updateBlock({letterSpacing:Number(event.target.value)})}/></label><label className="grid gap-1 text-sm font-semibold">Color<Input type="color" value={current.textColor?.startsWith("#")?current.textColor:"#f4f3ef"} onChange={(event)=>updateBlock({textColor:event.target.value})}/></label></div>}
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
                ? "O endereço Link Label permanece sempre igual. Ativa, desativa ou altera experiências sem reimprimir qualquer peça."
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
