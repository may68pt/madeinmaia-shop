export const PRODUCT_COLORS = [
  { name: "White", hex: "#f7f7f4" },
  { name: "Pastel Yellow", hex: "#ffe59a" },
  { name: "Sand", hex: "#ddc89d" },
  { name: "Pastel Orange", hex: "#ffab83" },
  { name: "Grey", hex: "#b7b8b8" },
  { name: "Black", hex: "#111111" },
  { name: "Dark Grey", hex: "#696b6b" },
  { name: "Mustard Yellow", hex: "#ffc21c" },
  { name: "Orange", hex: "#ff8926" },
  { name: "Red", hex: "#df3834" },
  { name: "Peach", hex: "#ffb083" },
  { name: "Pink", hex: "#f49ac0" },
  { name: "Purple", hex: "#765092" },
  { name: "Navy Blue", hex: "#1d3568" },
  { name: "Royal Blue", hex: "#2e59b8" },
  { name: "Aqua Blue", hex: "#3996e8" },
  { name: "Atol Blue", hex: "#39c2d7" },
  { name: "Pastel Blue", hex: "#9dc1de" },
  { name: "Mint Green", hex: "#c7e6c9" },
  { name: "Pastel Green", hex: "#6fa97b" },
  { name: "Kelly Green", hex: "#2e984c" },
  { name: "Forest Green", hex: "#174c35" },
  { name: "Mouse Brown", hex: "#9b7c64" },
  { name: "Chocolate Brown", hex: "#65402b" },
  { name: "Sarja", hex: "#ccc5b8" },
  { name: "Terracota", hex: "#ce522b" },
  { name: "Burgundy", hex: "#9c0026" },
  { name: "Stone", hex: "#b6b1a4" },
] as const;

const aliases: Record<string, string> = {
  Branco: "#f7f7f4",
  Preto: "#111111",
  Cinzento: "#b7b8b8",
  Vermelho: "#df3834",
  Azul: "#2e59b8",
  Verde: "#2e984c",
};

export function productColorHex(name: string) {
  return (
    PRODUCT_COLORS.find((color) => color.name === name)?.hex ??
    aliases[name] ??
    "#f7f7f4"
  );
}
