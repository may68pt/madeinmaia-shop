import type { ArtworkPlacements } from "@/lib/artwork-placement";

export type LocalFallbackProduct = {
  slug: string;
  name: string;
  nameTranslations: Record<string, string>;
  description: string;
  priceCents: number;
  collection: string;
  tags: string[];
  imageKey: string;
  gallery: string[];
  colors: string[];
  sizes: string[];
  disabledSupports: string[];
  monochrome: boolean;
  artworkPlacements: ArtworkPlacements;
};

const LIVE_UPLOADS = "https://madeinmaia.pt/uploads";

export const LOCAL_FALLBACK_PRODUCTS: LocalFallbackProduct[] = [
  { slug: "0078-arvore-do-conhecimento", name: "Tree of Knowledge", nameTranslations: { pt: "Árvore do Conhecimento" }, description: "An original Made in Maia design about curiosity, roots and ideas.", priceCents: 2000, collection: "Made in Maia", tags: ["Nature", "Illustration"], imageKey: `${LIVE_UPLOADS}/0078-arvore-do-conhecimento-58993c43.png`, gallery: [], colors: ["Unique"], sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"], disabledSupports: [], monochrome: false, artworkPlacements: {} },
  { slug: "0058-leao-em-frasco", name: "Lion in a Jar", nameTranslations: { pt: "Leão em Frasco" }, description: "A wild Made in Maia specimen, carefully bottled.", priceCents: 2000, collection: "Jars", tags: ["Jars", "Animals"], imageKey: `${LIVE_UPLOADS}/0058-leao-em-frasco-bf8bf492.png`, gallery: [], colors: ["Unique"], sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"], disabledSupports: [], monochrome: false, artworkPlacements: {} },
  { slug: "0056-frasco-de-gatos", name: "Jar of Cats", nameTranslations: { pt: "Frasco de Gatos" }, description: "Too many cats, one very small jar.", priceCents: 2000, collection: "Jars", tags: ["Jars", "Cats"], imageKey: `${LIVE_UPLOADS}/0056-frasco-de-gatos-e29191c6.png`, gallery: [], colors: ["Unique"], sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"], disabledSupports: [], monochrome: false, artworkPlacements: {} },
  { slug: "0178-i-am-groove", name: "I Am Groove", nameTranslations: { pt: "Eu Sou Groove" }, description: "A design for people who carry the rhythm with them.", priceCents: 2000, collection: "Music", tags: ["Music", "Quotes"], imageKey: `${LIVE_UPLOADS}/0178-i-am-groove-b9cbaec8.png`, gallery: [], colors: ["Unique"], sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"], disabledSupports: [], monochrome: false, artworkPlacements: {} },
  { slug: "0227-cool-dad", name: "Cool Dad", nameTranslations: { pt: "Pai Cool" }, description: "A monochrome Made in Maia classic for a genuinely cool dad.", priceCents: 2000, collection: "Quotes", tags: ["Quotes", "Family"], imageKey: `${LIVE_UPLOADS}/0227-cool-dad-63461fff.png`, gallery: [], colors: ["Unique"], sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"], disabledSupports: [], monochrome: true, artworkPlacements: {} },
  { slug: "0229-survival-rate", name: "Survival Rate", nameTranslations: { pt: "Taxa de Sobrevivência" }, description: "Optimism, with statistically questionable confidence.", priceCents: 2000, collection: "Quotes", tags: ["Quotes", "Internet Culture"], imageKey: `${LIVE_UPLOADS}/0229-survival-rate-349c3592.png`, gallery: [], colors: ["Unique"], sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"], disabledSupports: [], monochrome: false, artworkPlacements: {} },
];
