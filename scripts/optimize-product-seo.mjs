import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const apply = process.argv.includes("--apply");
const outputArg = process.argv.find((arg) => arg.startsWith("--output-dir="));
const outputDir = outputArg?.split("=").slice(1).join("=") || "/tmp/madeinmaia-seo";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const canonicalFor = (slug) => `https://madeinmaia.pt/designs/${slug}`;
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value, maximum) => {
  const text = clean(value);
  if (text.length <= maximum) return text;
  const sliced = text.slice(0, maximum + 1);
  const boundary = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, boundary > maximum * 0.65 ? boundary : maximum - 1).replace(/[,:;|\-\s]+$/g, "")}…`;
};
const normalizeTaxonomy = (value) => clean(value).replace(/[-_]+/g, " ");
const excludedTaxonomies = new Set(["made in maia", "design", "designs", "t shirt", "t shirts", "tshirt", "tshirts", "misc", "other"]);
const themeFor = (product) => {
  const values = [...(Array.isArray(product.tags) ? product.tags : []), product.collection]
    .map(normalizeTaxonomy)
    .filter((value) => value && !excludedTaxonomies.has(value.toLowerCase()));
  return [...new Set(values)][0] || "graphic art";
};
const sensitivePattern = /\b(disney|marvel|dc comics|star wars|pokemon|mario|zelda|one piece|luffy|naruto|dragon ball|sonic|simpsons|freddy mercury|queen|beatles|rolling stones|nirvana|harry potter|batman|superman|spider.?man|mickey|snoopy|hello kitty|studio ghibli|totoro|darth vader|joker)\b/i;

function seoTitle(product) {
  const name = clean(product.name);
  const theme = themeFor(product);
  const variants = [
    `${name} T-Shirt Design | Made in Maia`,
    `${name} Graphic T-Shirt | Made in Maia`,
    `${name} | Original Made in Maia Design`,
    `${name} — ${theme} T-Shirt Design`,
  ];
  const selected = variants[Math.abs(Number(product.id)) % variants.length];
  if (selected.length <= 60) return selected;
  const compact = `${name} | Made in Maia`;
  return compact.length <= 60 ? compact : clamp(name, 60);
}

function seoDescription(product) {
  const name = clean(product.name);
  const theme = themeFor(product);
  const description = clean(product.description);
  if (description && description.length >= 75) {
    const candidate = `${name}: ${description}`;
    if (candidate.length <= 160) return candidate;
    return clamp(candidate, 160);
  }
  const variants = [
    `${name} brings ${theme.toLowerCase()} into a bold original graphic by Made in Maia, made for people who like expressive, characterful design.`,
    `Explore ${name}, a distinctive Made in Maia graphic shaped by ${theme.toLowerCase()} and a playful visual idea that stands out without trying too hard.`,
    `${name} is a Made in Maia take on ${theme.toLowerCase()}, combining a clear visual concept with the offbeat personality behind the label.`,
    `A closer look at ${name}: an original Made in Maia design with a ${theme.toLowerCase()} theme, strong character and an independent graphic voice.`,
    `${name} turns ${theme.toLowerCase()} into an expressive Made in Maia design, created for anyone drawn to unusual ideas and memorable graphic art.`,
  ];
  return clamp(variants[Math.abs(Number(product.id)) % variants.length], 160);
}

const quoteCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const rows = await sql`
  select id, design_code, name, slug, description, collection, tags,
         seo_title, seo_description, seo_canonical, seo_no_index, status
  from products
  order by id
`;
const published = rows.filter((row) => row.status === "published");
const drafts = rows.filter((row) => row.status !== "published");
const duplicateSlugs = [...new Set(rows.map((row) => row.slug).filter((slug, index, all) => all.indexOf(slug) !== index))];
const plan = published.map((product) => {
  const proposedTitle = seoTitle(product);
  const proposedDescription = seoDescription(product);
  const proposedCanonical = canonicalFor(product.slug);
  const searchable = [product.name, product.collection, ...(Array.isArray(product.tags) ? product.tags : [])].join(" ");
  return {
    productId: product.id,
    productName: product.name,
    slug: product.slug,
    currentSeoTitle: product.seo_title,
    proposedSeoTitle: proposedTitle,
    seoTitleCharacterCount: proposedTitle.length,
    currentMetaDescription: product.seo_description,
    proposedMetaDescription: proposedDescription,
    metaDescriptionCharacterCount: proposedDescription.length,
    currentCanonical: product.seo_canonical,
    proposedCanonical,
    currentNoindex: product.seo_no_index,
    proposedNoindex: false,
    notes: sensitivePattern.test(searchable) ? "Brand/copyright-sensitive reference — human review recommended; no licensing claim added." : "",
  };
});

const titleCounts = new Map();
const descriptionCounts = new Map();
for (const item of plan) {
  titleCounts.set(item.proposedSeoTitle, (titleCounts.get(item.proposedSeoTitle) ?? 0) + 1);
  descriptionCounts.set(item.proposedMetaDescription, (descriptionCounts.get(item.proposedMetaDescription) ?? 0) + 1);
}
for (const item of plan) {
  if ((titleCounts.get(item.proposedSeoTitle) ?? 0) > 1) {
    item.proposedSeoTitle = clamp(`${item.proposedSeoTitle.replace(/\s*\| Made in Maia$/, "")} | ${item.productId}`, 60);
    item.seoTitleCharacterCount = item.proposedSeoTitle.length;
  }
  if ((descriptionCounts.get(item.proposedMetaDescription) ?? 0) > 1) {
    item.proposedMetaDescription = clamp(`${item.proposedMetaDescription} Design ${item.productId}.`, 160);
    item.metaDescriptionCharacterCount = item.proposedMetaDescription.length;
  }
}

const violations = plan.filter((item) => item.seoTitleCharacterCount > 60 || item.metaDescriptionCharacterCount > 160 || !item.proposedCanonical.startsWith("https://madeinmaia.pt/designs/") || item.proposedNoindex !== false);
const finalDuplicateTitles = [...new Set(plan.map((item) => item.proposedSeoTitle).filter((title, index, all) => all.indexOf(title) !== index))];
const finalDuplicateDescriptions = [...new Set(plan.map((item) => item.proposedMetaDescription).filter((description, index, all) => all.indexOf(description) !== index))];
if (violations.length || finalDuplicateTitles.length || finalDuplicateDescriptions.length || duplicateSlugs.length) {
  throw new Error(`SEO validation failed: ${JSON.stringify({ violations: violations.length, duplicateTitles: finalDuplicateTitles, duplicateDescriptions: finalDuplicateDescriptions, duplicateSlugs })}`);
}

await fs.mkdir(outputDir, { recursive: true });
const timestamp = new Date().toISOString().replaceAll(":", "-");
const backupPath = path.join(outputDir, `product-seo-backup-${timestamp}.json`);
const planPath = path.join(outputDir, `product-seo-plan-${timestamp}.json`);
const csvPath = path.join(outputDir, `product-seo-final-${timestamp}.csv`);
await fs.writeFile(backupPath, `${JSON.stringify(rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, seoTitle: row.seo_title, seoDescription: row.seo_description, seoCanonical: row.seo_canonical, seoNoIndex: row.seo_no_index, status: row.status })), null, 2)}\n`);
await fs.writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
const headings = Object.keys(plan[0] ?? {});
await fs.writeFile(csvPath, `${headings.map(quoteCsv).join(",")}\n${plan.map((item) => headings.map((heading) => quoteCsv(item[heading])).join(",")).join("\n")}\n`);

if (apply) {
  await sql.begin(async (transaction) => {
    for (const item of plan) {
      await transaction`
        update products
        set seo_title = ${item.proposedSeoTitle},
            seo_description = ${item.proposedMetaDescription},
            seo_canonical = ${item.proposedCanonical},
            seo_no_index = false,
            updated_at = now()
        where id = ${item.productId} and status = 'published'
      `;
    }
  });
}

const updatedRows = apply ? await sql`select id, slug, seo_title, seo_description, seo_canonical, seo_no_index from products where status = 'published' order by id` : [];
const postUpdateErrors = apply ? updatedRows.filter((row) => row.seo_title.length > 60 || row.seo_description.length > 160 || row.seo_canonical !== canonicalFor(row.slug) || row.seo_no_index !== false) : [];
const summary = {
  mode: apply ? "apply" : "dry-run",
  totalProducts: rows.length,
  publishedProducts: published.length,
  draftProductsNotChanged: drafts.length,
  seoTitlesUpdated: plan.filter((item) => item.currentSeoTitle !== item.proposedSeoTitle).length,
  metaDescriptionsUpdated: plan.filter((item) => item.currentMetaDescription !== item.proposedMetaDescription).length,
  canonicalUrlsUpdated: plan.filter((item) => item.currentCanonical !== item.proposedCanonical).length,
  noindexChanged: plan.filter((item) => item.currentNoindex !== item.proposedNoindex).length,
  duplicatesFound: finalDuplicateTitles.length + finalDuplicateDescriptions.length + duplicateSlugs.length,
  productsFlaggedForHumanReview: plan.filter((item) => item.notes).length,
  errorsOrProductsNotUpdated: postUpdateErrors.length,
  backupPath,
  planPath,
  csvPath,
};
console.log(JSON.stringify(summary, null, 2));
console.log("FLAGGED_PRODUCTS", JSON.stringify(plan.filter((item) => item.notes).map(({ productId, productName, slug, notes }) => ({ productId, productName, slug, notes }))));
await sql.end();
