import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull().default(2000),
  collection: text("collection").notNull().default("Made in Maia"),
  imageKey: text("image_key"),
  colorsJson: text("colors_json").notNull().default("[]"),
  sizesJson: text("sizes_json").notNull().default("[]"),
  status: text("status").notNull().default("draft"),
  updatedAt: integer("updated_at").notNull(),
});

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  blocksJson: text("blocks_json").notNull().default("[]"),
  status: text("status").notNull().default("draft"),
  updatedAt: integer("updated_at").notNull(),
});

export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  blocksJson: text("blocks_json").notNull().default("[]"),
  updatedAt: integer("updated_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  customerEmail: text("customer_email").notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("pending"),
  paymentProvider: text("payment_provider"),
  paymentReference: text("payment_reference"),
  createdAt: integer("created_at").notNull(),
});
