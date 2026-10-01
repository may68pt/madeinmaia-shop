import { readFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.IMPORT_BASE_URL || "https://madeinmaia-shop.onrender.com";
const studioPassword = process.env.STUDIO_PASSWORD;
const coverDirectory = process.env.IMPORT_COVER_DIR || "/tmp/mim-import/covers";

if (!studioPassword) throw new Error("STUDIO_PASSWORD is required");

const manifest = JSON.parse(
  await readFile(new URL("./published-products.json", import.meta.url), "utf8"),
);

async function request(url, options, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      const message = await response.text();
      throw new Error(`${response.status} ${message}`);
    } catch (error) {
      lastError = error;
      if (attempt < attempts)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function uploadCover(filename) {
  const bytes = await readFile(path.join(coverDirectory, filename));
  const extension = path.extname(filename).toLowerCase();
  const mime =
    extension === ".jpg" || extension === ".jpeg"
      ? "image/jpeg"
      : extension === ".webp"
        ? "image/webp"
        : "image/png";
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mime }), filename);
  const response = await request(`${baseUrl}/api/media/upload`, {
    method: "POST",
    headers: { "x-studio-key": studioPassword },
    body: form,
  });
  return (await response.json()).url;
}

const products = [];
let uploaded = 0;
for (const item of manifest) {
  let imageKey = null;
  if (item.coverFile) {
    imageKey = await uploadCover(item.coverFile);
    uploaded += 1;
    if (uploaded % 20 === 0) console.log(`Uploaded ${uploaded} covers`);
  }
  products.push({
    slug: item.slug,
    designCode: item.designCode,
    name: item.name,
    nameTranslations: {},
    description: "",
    priceCents: 2000,
    tags: [],
    imageKey,
    gallery: [],
    disabledSupports: [],
    colors: [],
    sizes: [],
    variants: [],
    status: "published",
  });
}

const response = await request(`${baseUrl}/api/studio`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-studio-key": studioPassword,
  },
  body: JSON.stringify({
    resource: "products",
    entries: products,
    replace: true,
  }),
});
const result = await response.json();
console.log(`Published ${result.count} products with ${uploaded} covers.`);
