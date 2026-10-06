import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { ProductVariant } from "@/lib/product-variants";
import type { ArtworkPlacements } from "@/lib/artwork-placement";
import type { CatalogColor, ProductSupport } from "@/lib/product-catalog";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  designCode: text("design_code").notNull().default(""),
  name: text("name").notNull(),
  nameTranslations: jsonb("name_translations").$type<Record<string, string>>().notNull().default({}),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull().default(2000),
  collection: text("collection").notNull().default("Made in Maia"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  imageKey: text("image_key"),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  disabledSupports: jsonb("disabled_supports").$type<string[]>().notNull().default([]),
  artworkPlacements: jsonb("artwork_placements").$type<ArtworkPlacements>().notNull().default({}),
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  previewColorIds: jsonb("preview_color_ids").$type<string[]>().notNull().default([]),
  sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
  variants: jsonb("variants")
    .$type<ProductVariant[]>()
    .notNull()
    .default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  monochrome: boolean("monochrome").notNull().default(false),
  onlineSaleEnabled: boolean("online_sale_enabled").notNull().default(true),
  salesRank: integer("sales_rank").notNull().default(0),
  status: text("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  blocks: jsonb("blocks").$type<unknown[]>().notNull().default([]),
  status: text("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  blocks: jsonb("blocks").$type<unknown[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull().default(""),
  customerPhone: text("customer_phone").notNull().default(""),
  shippingAddress: jsonb("shipping_address")
    .$type<
      Partial<{
        address: string;
        postalCode: string;
        city: string;
        country: string;
      }>
    >()
    .notNull()
    .default({}),
  items: jsonb("items")
    .$type<
      Array<{
        slug: string;
        name: string;
        color: string;
        printColor?: "black" | "white";
        size: string;
        productType: string;
        quantity: number;
        unitPriceCents: number;
      }>
    >()
    .notNull()
    .default([]),
  shippingCents: integer("shipping_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("pending"),
  paymentProvider: text("payment_provider"),
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const randomContent = pgTable("random_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull().default("text"),
  body: text("body").notNull().default(""),
  category: text("category").notNull().default("Internet gem"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  mediaUrl: text("media_url"),
  linkUrl: text("link_url"),
  linkLabel: text("link_label").notNull().default("Descobrir"),
  weight: integer("weight").notNull().default(1),
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SiteSettings = {
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
  navigation: Array<{
    id: string;
    label: string;
    url: string;
    visible: boolean;
    children?: Array<{ id:string; label:string; url:string; visible:boolean }>;
  }>;
  terms: string;
  privacy: string;
  returns: string;
  cssFiles?: Array<{ id:string; name:string; content:string; enabled:boolean }>;
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
  productCatalog: {
    colors: CatalogColor[];
    supports: ProductSupport[];
  };
};

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  data: jsonb("data").$type<SiteSettings>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const designFeedback = pgTable("design_feedback", {
  id: serial("id").primaryKey(),
  productSlug: text("product_slug").notNull(),
  visitorId: text("visitor_id").notNull(),
  vote: integer("vote").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("design_feedback_visitor_product_idx").on(table.visitorId, table.productSlug)]);

export const userAccounts = pgTable("user_accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("client"),
  createdAt: timestamp("created_at", { withTimezone:true }).notNull().defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: integer("user_id").notNull().references(()=>userAccounts.id,{onDelete:"cascade"}),
  expiresAt: timestamp("expires_at", { withTimezone:true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone:true }).notNull().defaultNow(),
});
