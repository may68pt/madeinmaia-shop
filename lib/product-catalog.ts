export type CatalogColor = { id: string; name: string; hex: string; active: boolean };
export type ProductSupport = {
  id: string;
  categoryId: "apparel" | "accessories" | "bags";
  name: string;
  variantMode: "size" | "audience" | "none";
  sizes: string[];
  colorIds: string[];
  availability: Record<string, string[]>;
  active: boolean;
  mockups: Record<string, string>;
};

const kids = ["2", "4", "6", "8", "10", "12"];
const adults = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
export const CATALOG_SIZES = [...kids, ...adults, "Único"];
export const CATALOG_CATEGORIES = [
  { id: "apparel", name: "Vestuário" },
  { id: "accessories", name: "Acessórios" },
  { id: "bags", name: "Sacos" },
] as const;

export const DEFAULT_COLORS: CatalogColor[] = [
  ["white", "White", "#f7f7f4"], ["grey", "Grey", "#b7b8b8"], ["black", "Black", "#111111"],
  ["pastel-yellow", "Pastel Yellow", "#ffe59a"], ["sand", "Sand", "#ddc89d"], ["pastel-orange", "Pastel Orange", "#ffab83"],
  ["dark-grey", "Dark Grey", "#696b6b"], ["mustard-yellow", "Mustard Yellow", "#ffc21c"], ["orange", "Orange", "#ff8926"],
  ["red", "Red", "#df3834"], ["peach", "Peach", "#ffb083"], ["pink", "Pink", "#f49ac0"], ["purple", "Purple", "#765092"],
  ["navy-blue", "Navy Blue", "#1d3568"], ["royal-blue", "Royal Blue", "#2e59b8"], ["aqua-blue", "Aqua Blue", "#3996e8"],
  ["atol-blue", "Atol Blue", "#39c2d7"], ["pastel-blue", "Pastel Blue", "#9dc1de"], ["mint-green", "Mint Green", "#c7e6c9"],
  ["pastel-green", "Pastel Green", "#6fa97b"], ["kelly-green", "Kelly Green", "#2e984c"], ["forest-green", "Forest Green", "#174c35"],
  ["mouse-brown", "Mouse Brown", "#9b7c64"], ["chocolate-brown", "Chocolate Brown", "#65402b"], ["sarja", "Sarja", "#ccc5b8"],
  ["terracota", "Terracota", "#ce522b"], ["burgundy", "Burgundy", "#9c0026"], ["stone", "Stone", "#b6b1a4"],
].map(([id, name, hex]) => ({ id, name, hex, active: true }));

const allColorIds = DEFAULT_COLORS.map((color) => color.id);
const available = (colorIds:string[], options:string[]) => Object.fromEntries(colorIds.map((id)=>[id,options]));
export const DEFAULT_SUPPORTS: ProductSupport[] = [
  { id:"tshirt-150", categoryId:"apparel", name:"T-shirt 150g", variantMode:"size", sizes:[...kids,...adults], colorIds:allColorIds, availability:available(allColorIds,[...kids,...adults]), active:true, mockups:{} },
  { id:"tshirt-190", categoryId:"apparel", name:"T-shirt 190g", variantMode:"size", sizes:[...kids,...adults], colorIds:allColorIds, availability:available(allColorIds,[...kids,...adults]), active:true, mockups:{} },
  { id:"hoodie", categoryId:"apparel", name:"Hoodie", variantMode:"size", sizes:[...kids,...adults], colorIds:allColorIds, availability:available(allColorIds,[...kids,...adults]), active:true, mockups:{} },
  { id:"long-sleeve", categoryId:"apparel", name:"Long Sleeve T-shirt", variantMode:"size", sizes:[...kids,...adults], colorIds:allColorIds, availability:available(allColorIds,[...kids,...adults]), active:true, mockups:{} },
  { id:"sunglasses", categoryId:"accessories", name:"Sun Glasses", variantMode:"audience", sizes:["Kids","Adults"], colorIds:allColorIds, availability:available(allColorIds,["Kids","Adults"]), active:true, mockups:{} },
  { id:"tote-bag", categoryId:"bags", name:"Tote Bag", variantMode:"none", sizes:[], colorIds:["grey","white"], availability:available(["grey","white"],[]), active:true, mockups:{} },
];

export function normalizeSupport(value: Partial<ProductSupport>): ProductSupport {
  const fallback = DEFAULT_SUPPORTS.find((support) => support.id === value.id);
  const categoryId = value.categoryId === "accessories" || value.categoryId === "bags" ? value.categoryId : fallback?.categoryId ?? "apparel";
  const variantMode = value.variantMode === "audience" || value.variantMode === "none" ? value.variantMode : fallback?.variantMode ?? "size";
  const sizes = variantMode === "none" ? [] : value.sizes ?? fallback?.sizes ?? (variantMode === "audience" ? ["Kids", "Adults"] : [...kids, ...adults]);
  const colorIds = value.colorIds ?? fallback?.colorIds ?? [];
  const storedAvailability = value.availability && typeof value.availability === "object" ? value.availability : {};
  const availability = Object.fromEntries(colorIds.map((colorId) => [colorId, Array.isArray(storedAvailability[colorId]) ? storedAvailability[colorId] : [...sizes]]));
  return {
    id: value.id ?? `support-${Date.now()}`,
    categoryId,
    name: value.name ?? "Novo suporte",
    variantMode,
    sizes,
    colorIds,
    availability,
    active: value.active !== false,
    mockups: value.mockups ?? {},
  };
}

export function supportOptions(support: ProductSupport, colorId: string) {
  if (support.variantMode === "none") return [];
  return support.availability[colorId] ?? support.sizes;
}
