export type PageBlockType = "Hero" | "Produtos" | "Coleções" | "Logo aleatório" | "Linktree" | "Localização" | "Banner" | "Texto";
export type PageBlock = {
  id: number;
  type: PageBlockType;
  title: string;
  description: string;
  eyebrow?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  background?: string;
  textColor?: string;
  width?: "full" | "content" | "narrow";
  align?: "left" | "center";
  spacing?: "compact" | "normal" | "large";
  imageUrl?: string;
  translations?: Record<string, Partial<Pick<PageBlock,"title"|"description"|"eyebrow"|"ctaLabel">>>;
};

export const DEFAULT_PAGE_BLOCKS: PageBlock[] = [
  { id:1, type:"Hero", eyebrow:"Desenhos locais, atitude global", title:"Veste uma ideia.", description:"T-shirts desenhadas e impressas na Maia. Escolhe o design, a cor e o tamanho — nós tratamos do resto.", ctaLabel:"Ver novos designs", ctaUrl:"#novidades", background:"var(--brand)", textColor:"#ffffff", width:"full", align:"left", spacing:"large" },
  { id:2, type:"Produtos", eyebrow:"Acabados de chegar", title:"Novos na loja", description:"", background:"var(--paper)", textColor:"var(--foreground)", width:"content", align:"left", spacing:"normal" },
  { id:3, type:"Banner", eyebrow:"Descobre", title:"Uma surpresa em cada símbolo.", description:"O símbolo abre um conteúdo diferente cada vez.", ctaLabel:"Descobrir", ctaUrl:"/descobre", background:"var(--accent-brand)", textColor:"var(--ink)", width:"content", align:"left", spacing:"normal" },
  { id:4, type:"Coleções", eyebrow:"Explore by mood", title:"Cats, Quotes & Jars", description:"Three collections, one local point of view.", background:"var(--surface)", textColor:"var(--foreground)", width:"content", align:"left", spacing:"large" },
  { id:5, type:"Logo aleatório", eyebrow:"Our logo is a portal", title:"Scan it. Something different appears every time.", description:"The Made in Maia symbol links to a rotating collection of local stories, images, ideas and surprises.", ctaLabel:"Try it now", ctaUrl:"/descobre", background:"var(--accent-brand)", textColor:"var(--ink)", width:"full", align:"center", spacing:"large" },
  { id:6, type:"Localização", eyebrow:"Find us in Porto", title:"The building is part of the story.", description:"Visit Made in Maia at Mercado Ferreira Borges / Hard Club, inside River Market.", ctaLabel:"Open River Market", ctaUrl:"https://rivermarket.pt", background:"#8d2b20", textColor:"#ffffff", width:"full", align:"left", spacing:"large" },
  { id:7, type:"Linktree", eyebrow:"Stay close", title:"Markets, people and new drops.", description:"Follow the project, discover our markets or join the team.", ctaLabel:"Open our links", ctaUrl:"/links", background:"var(--ink)", textColor:"#ffffff", width:"content", align:"center", spacing:"normal" },
];

export function withRequiredHomeBlocks(blocks: PageBlock[]) {
  const required:PageBlockType[] = ["Coleções","Logo aleatório","Localização","Linktree"];
  return [...blocks, ...DEFAULT_PAGE_BLOCKS.filter((block)=>required.includes(block.type)&&!blocks.some((item)=>item.type===block.type))];
}
