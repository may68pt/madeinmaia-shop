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

type BlockCopy = Pick<PageBlock,"title"|"description"> & Partial<Pick<PageBlock,"eyebrow"|"ctaLabel">>;
export const BLOCK_COPY: Record<PageBlockType, Record<string,BlockCopy>> = {
  Hero:{en:{eyebrow:"Local designs, global attitude",title:"Wear an idea.",description:"T-shirts designed and printed in Maia. Choose the design, colour and size — we take care of the rest.",ctaLabel:"See new designs"},pt:{eyebrow:"Desenhos locais, atitude global",title:"Veste uma ideia.",description:"T-shirts desenhadas e impressas na Maia. Escolhe o design, a cor e o tamanho — nós tratamos do resto.",ctaLabel:"Ver novos designs"},es:{eyebrow:"Diseños locales, actitud global",title:"Viste una idea.",description:"Camisetas diseñadas e impresas en Maia. Elige el diseño, color y talla; nosotros nos encargamos del resto.",ctaLabel:"Ver nuevos diseños"},de:{eyebrow:"Lokale Designs, globale Haltung",title:"Trag eine Idee.",description:"In Maia entworfene und bedruckte T-Shirts. Wähle Design, Farbe und Größe — wir kümmern uns um den Rest.",ctaLabel:"Neue Designs ansehen"},fr:{eyebrow:"Designs locaux, attitude globale",title:"Portez une idée.",description:"T-shirts conçus et imprimés à Maia. Choisissez le design, la couleur et la taille — nous nous occupons du reste.",ctaLabel:"Voir les nouveautés"}},
  Produtos:{en:{eyebrow:"Just arrived",title:"New in the shop",description:""},pt:{eyebrow:"Acabados de chegar",title:"Novos na loja",description:""},es:{eyebrow:"Recién llegados",title:"Nuevos en la tienda",description:""},de:{eyebrow:"Neu eingetroffen",title:"Neu im Shop",description:""},fr:{eyebrow:"Tout juste arrivés",title:"Nouveautés",description:""}},
  Coleções:{en:{eyebrow:"Explore by mood",title:"Cats, Quotes & Jars",description:"Three collections, one local point of view."},pt:{eyebrow:"Explora por tema",title:"Gatos, Frases e Frascos",description:"Três coleções, um ponto de vista local."},es:{eyebrow:"Explora por tema",title:"Gatos, Frases y Frascos",description:"Tres colecciones, un punto de vista local."},de:{eyebrow:"Nach Stimmung entdecken",title:"Katzen, Sprüche & Gläser",description:"Drei Kollektionen, eine lokale Perspektive."},fr:{eyebrow:"Explorer par univers",title:"Chats, Citations et Bocaux",description:"Trois collections, un point de vue local."}},
  "Logo aleatório":{en:{eyebrow:"Our logo is a portal",title:"Scan it. Something different appears every time.",description:"The Made in Maia symbol opens a rotating collection of local stories, images, ideas and surprises.",ctaLabel:"Try it now"},pt:{eyebrow:"O nosso logótipo é um portal",title:"Lê o código. Aparece algo diferente de cada vez.",description:"O símbolo Made in Maia abre uma coleção rotativa de histórias locais, imagens, ideias e surpresas.",ctaLabel:"Experimentar agora"},es:{eyebrow:"Nuestro logotipo es un portal",title:"Escanéalo. Cada vez aparece algo diferente.",description:"El símbolo de Made in Maia abre una colección cambiante de historias, imágenes, ideas y sorpresas locales.",ctaLabel:"Probar ahora"},de:{eyebrow:"Unser Logo ist ein Portal",title:"Scanne es. Jedes Mal erscheint etwas anderes.",description:"Das Made-in-Maia-Symbol öffnet wechselnde lokale Geschichten, Bilder, Ideen und Überraschungen.",ctaLabel:"Jetzt ausprobieren"},fr:{eyebrow:"Notre logo est un portail",title:"Scannez-le. Une surprise différente apparaît à chaque fois.",description:"Le symbole Made in Maia ouvre une collection changeante d’histoires, d’images, d’idées et de surprises locales.",ctaLabel:"Essayer maintenant"}},
  Localização:{en:{eyebrow:"Find us in Porto",title:"The building is part of the story.",description:"Visit Made in Maia at Mercado Ferreira Borges / Hard Club, inside River Market.",ctaLabel:"Open River Market"},pt:{eyebrow:"Encontra-nos no Porto",title:"O edifício faz parte da história.",description:"Visita a Made in Maia no Mercado Ferreira Borges / Hard Club, dentro do River Market.",ctaLabel:"Abrir River Market"},es:{eyebrow:"Encuéntranos en Oporto",title:"El edificio forma parte de la historia.",description:"Visita Made in Maia en Mercado Ferreira Borges / Hard Club, dentro de River Market.",ctaLabel:"Abrir River Market"},de:{eyebrow:"Finde uns in Porto",title:"Das Gebäude ist Teil der Geschichte.",description:"Besuche Made in Maia im Mercado Ferreira Borges / Hard Club, im River Market.",ctaLabel:"River Market öffnen"},fr:{eyebrow:"Retrouvez-nous à Porto",title:"Le bâtiment fait partie de l’histoire.",description:"Rendez visite à Made in Maia au Mercado Ferreira Borges / Hard Club, dans le River Market.",ctaLabel:"Ouvrir River Market"}},
  Linktree:{en:{eyebrow:"Stay close",title:"Markets, people and new drops.",description:"Follow the project, discover our markets or join the team.",ctaLabel:"Open our links"},pt:{eyebrow:"Fica por perto",title:"Mercados, pessoas e novidades.",description:"Segue o projeto, descobre os nossos mercados ou junta-te à equipa.",ctaLabel:"Abrir os nossos links"},es:{eyebrow:"Sigue cerca",title:"Mercados, personas y novedades.",description:"Sigue el proyecto, descubre nuestros mercados o únete al equipo.",ctaLabel:"Abrir nuestros enlaces"},de:{eyebrow:"Bleib in Kontakt",title:"Märkte, Menschen und Neuheiten.",description:"Folge dem Projekt, entdecke unsere Märkte oder werde Teil des Teams.",ctaLabel:"Unsere Links öffnen"},fr:{eyebrow:"Restons proches",title:"Marchés, rencontres et nouveautés.",description:"Suivez le projet, découvrez nos marchés ou rejoignez l’équipe.",ctaLabel:"Ouvrir nos liens"}},
  Banner:{en:{eyebrow:"Discover",title:"A surprise behind every symbol.",description:"The symbol opens different content every time.",ctaLabel:"Discover"},pt:{eyebrow:"Descobre",title:"Uma surpresa em cada símbolo.",description:"O símbolo abre um conteúdo diferente de cada vez.",ctaLabel:"Descobrir"},es:{eyebrow:"Descubre",title:"Una sorpresa en cada símbolo.",description:"El símbolo abre un contenido diferente cada vez.",ctaLabel:"Descubrir"},de:{eyebrow:"Entdecken",title:"Eine Überraschung hinter jedem Symbol.",description:"Das Symbol öffnet jedes Mal einen anderen Inhalt.",ctaLabel:"Entdecken"},fr:{eyebrow:"Découvrir",title:"Une surprise derrière chaque symbole.",description:"Le symbole ouvre un contenu différent à chaque fois.",ctaLabel:"Découvrir"}},
  Texto:{en:{title:"Made in Maia",description:"Original ideas, made locally."},pt:{title:"Made in Maia",description:"Ideias originais, feitas localmente."},es:{title:"Made in Maia",description:"Ideas originales, hechas localmente."},de:{title:"Made in Maia",description:"Originelle Ideen, lokal gemacht."},fr:{title:"Made in Maia",description:"Des idées originales, créées localement."}},
};

export function localizedBlock(block:PageBlock, locale:string):PageBlock {
  const stored = block.translations?.[locale];
  if (stored && Object.values(stored).some(Boolean)) return { ...block, ...stored };
  const fallback = BLOCK_COPY[block.type]?.[locale];
  if (!fallback) return block;
  return { ...block, ...fallback };
}

export const DEFAULT_PAGE_BLOCKS: PageBlock[] = [
  { id:1, type:"Hero", ...BLOCK_COPY.Hero.en, translations:Object.fromEntries(Object.entries(BLOCK_COPY.Hero).filter(([key])=>key!=="en")), ctaUrl:"#novidades", background:"var(--brand)", textColor:"#ffffff", width:"full", align:"left", spacing:"large" },
  { id:2, type:"Produtos", ...BLOCK_COPY.Produtos.en, translations:Object.fromEntries(Object.entries(BLOCK_COPY.Produtos).filter(([key])=>key!=="en")), background:"var(--paper)", textColor:"var(--foreground)", width:"content", align:"left", spacing:"normal" },
  { id:3, type:"Banner", ...BLOCK_COPY.Banner.en, translations:Object.fromEntries(Object.entries(BLOCK_COPY.Banner).filter(([key])=>key!=="en")), ctaUrl:"/descobre", background:"var(--accent-brand)", textColor:"var(--ink)", width:"content", align:"left", spacing:"normal" },
  { id:4, type:"Coleções", eyebrow:"Explore by mood", title:"Cats, Quotes & Jars", description:"Three collections, one local point of view.", background:"var(--surface)", textColor:"var(--foreground)", width:"content", align:"left", spacing:"large" },
  { id:5, type:"Logo aleatório", eyebrow:"Our logo is a portal", title:"Scan it. Something different appears every time.", description:"The Made in Maia symbol links to a rotating collection of local stories, images, ideas and surprises.", ctaLabel:"Try it now", ctaUrl:"/descobre", background:"var(--accent-brand)", textColor:"var(--ink)", width:"full", align:"center", spacing:"large" },
  { id:6, type:"Localização", eyebrow:"Find us in Porto", title:"The building is part of the story.", description:"Visit Made in Maia at Mercado Ferreira Borges / Hard Club, inside River Market.", ctaLabel:"Open River Market", ctaUrl:"https://rivermarket.pt", background:"#8d2b20", textColor:"#ffffff", width:"full", align:"left", spacing:"large" },
  { id:7, type:"Linktree", eyebrow:"Stay close", title:"Markets, people and new drops.", description:"Follow the project, discover our markets or join the team.", ctaLabel:"Open our links", ctaUrl:"/links", background:"var(--ink)", textColor:"#ffffff", width:"content", align:"center", spacing:"normal" },
];

export function withRequiredHomeBlocks(blocks: PageBlock[]) {
  const required:PageBlockType[] = ["Coleções","Logo aleatório","Localização","Linktree"];
  return [...blocks, ...DEFAULT_PAGE_BLOCKS.filter((block)=>required.includes(block.type)&&!blocks.some((item)=>item.type===block.type))];
}
