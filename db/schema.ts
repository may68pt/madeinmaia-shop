import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
  status: text("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  blocks: jsonb("blocks").$type<unknown[]>().notNull().default([]),
  status: text("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  blocks: jsonb("blocks").$type<unknown[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  customerEmail: text("customer_email").notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("pending"),
  paymentProvider: text("payment_provider"),
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
