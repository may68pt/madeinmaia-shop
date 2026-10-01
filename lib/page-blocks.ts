export type PageBlockType = "Hero" | "Produtos" | "Banner" | "Texto";
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
};

export const DEFAULT_PAGE_BLOCKS: PageBlock[] = [
  { id:1, type:"Hero", eyebrow:"Desenhos locais, atitude global", title:"Veste uma ideia.", description:"T-shirts desenhadas e impressas na Maia. Escolhe o design, a cor e o tamanho — nós tratamos do resto.", ctaLabel:"Ver novos designs", ctaUrl:"#novidades", background:"var(--brand)", textColor:"#ffffff", width:"full", align:"left", spacing:"large" },
  { id:2, type:"Produtos", eyebrow:"Acabados de chegar", title:"Novos na loja", description:"", background:"var(--paper)", textColor:"var(--ink)", width:"content", align:"left", spacing:"normal" },
  { id:3, type:"Banner", eyebrow:"Descobre", title:"Uma surpresa em cada símbolo.", description:"O símbolo abre um conteúdo diferente cada vez.", ctaLabel:"Descobrir", ctaUrl:"/descobre", background:"var(--accent-brand)", textColor:"var(--ink)", width:"content", align:"left", spacing:"normal" },
];
