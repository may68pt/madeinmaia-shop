"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  key: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  color: string;
  size: string;
  quantity: number;
};

const storageKey = "madeinmaia-cart";
const emptyCart: CartItem[] = [];
let cachedRaw = "";
let cachedCart: CartItem[] = emptyCart;

function readCart() {
  if (typeof window === "undefined") return emptyCart;
  const raw = window.localStorage.getItem(storageKey) ?? "[]";
  if (raw === cachedRaw) return cachedCart;
  cachedRaw = raw;
  try { cachedCart = JSON.parse(raw) as CartItem[]; } catch { cachedCart = emptyCart; }
  return cachedCart;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("madeinmaia-cart", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("madeinmaia-cart", callback); };
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new Event("madeinmaia-cart"));
}

export function useCart() { return useSyncExternalStore(subscribe, readCart, () => emptyCart); }

export function addCartItem(item: Omit<CartItem, "key" | "quantity">) {
  const items = readCart();
  const key = `${item.slug}:${item.color}:${item.size}`;
  const existing = items.find((entry) => entry.key === key);
  writeCart(existing ? items.map((entry) => entry.key === key ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...items, { ...item, key, quantity: 1 }]);
}

export function removeCartItem(key: string) { writeCart(readCart().filter((item) => item.key !== key)); }
export function clearCart() { writeCart([]); }
