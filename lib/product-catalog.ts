export type CatalogColor = { id: string; name: string; hex: string; active: boolean };
export type ProductSupport = {
  id: string;
  name: string;
  sizes: string[];
  colorIds: string[];
  active: boolean;
  mockups: Record<string, string>;
};

const kids = ["2", "4", "6", "8", "10", "12"];
const adults = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

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
export const DEFAULT_SUPPORTS: ProductSupport[] = [
  { id: "tshirt-150", name: "T-shirt 150g", sizes: [...kids, ...adults], colorIds: allColorIds, active: true, mockups: {} },
  { id: "tshirt-190", name: "T-shirt 190g", sizes: [...kids, ...adults], colorIds: allColorIds, active: true, mockups: {} },
  { id: "hoodie", name: "Hoodie", sizes: [...kids, ...adults], colorIds: allColorIds, active: true, mockups: {} },
  { id: "long-sleeve", name: "Long Sleeve T-shirt", sizes: [...kids, ...adults], colorIds: allColorIds, active: true, mockups: {} },
  { id: "sunglasses", name: "Sun Glasses", sizes: ["Único"], colorIds: allColorIds, active: true, mockups: {} },
  { id: "tote-bag", name: "Tote Bag", sizes: ["Único"], colorIds: ["grey", "white"], active: true, mockups: {} },
];
