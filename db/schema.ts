import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull().default(2000),
  collection: text("collection").notNull().default("Made in Maia"),
  imageKey: text("image_key"),
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
  variants: jsonb("variants")
    .$type<Array<{ sku: string; color: string; size: string; stock: number }>>()
    .notNull()
    .default([]),
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
        size: string;
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
  terms: string;
  privacy: string;
  returns: string;
  media: Array<{ url: string; alt: string }>;
};

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  data: jsonb("data").$type<SiteSettings>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
