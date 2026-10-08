/** Shipping prices are in euro cents. Free shipping applies only within Portugal. */
export function isPortugal(country: string): boolean {
  const normalized = country.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
  return ["portugal", "pt", "portuguesa", "republica portuguesa", "portuguese republic"].includes(normalized);
}

export function calculateShippingCents(country: string, subtotalCents: number): number {
  return isPortugal(country) ? (subtotalCents >= 4500 ? 0 : 490) : 799;
}
