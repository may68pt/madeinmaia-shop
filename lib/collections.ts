export function collectionSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function productTaxonomies(product: { tags: string[]; collection: string }) {
  return [...new Set([...(product.tags ?? []), product.collection].map((item) => item.trim()).filter(Boolean))];
}
