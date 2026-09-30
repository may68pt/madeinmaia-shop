export const PRODUCT_TYPES = [
  { key: "kids-tshirt", label: "T-shirts · Kids", sizes: ["2", "4", "6", "8", "10", "12"] },
  { key: "adult-tshirt", label: "T-shirts · Adults", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
  { key: "sweat", label: "Sweats", sizes: ["XS", "S", "M", "L", "XL", "2XL"] },
  { key: "hoodie", label: "Hoodies", sizes: ["XS", "S", "M", "L", "XL", "2XL"] },
] as const;

export type ProductTypeKey = (typeof PRODUCT_TYPES)[number]["key"];
export type ProductVariant = {
  sku: string;
  type: string;
  color: string;
  size: string;
  stock: number;
  active: boolean;
};

export function productTypeLabel(key: string) {
  return PRODUCT_TYPES.find((type) => type.key === key)?.label ?? key;
}
