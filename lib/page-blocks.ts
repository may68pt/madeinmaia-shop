export type PageBlockType = "Hero" | "Produtos" | "Coleções" | "Logo aleatório" | "Linktree" | "Localização" | "Banner" | "Texto" | "Post Title";
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
  headingTag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "p" | "span";
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  imageCredit?: string;
  imageCreditUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  productSource?: "all" | "tag" | "selection";
  productTag?: string;
  productSlugs?: string[];
  productLimit?: number;
  productOrder?: "random" | "asc" | "desc";
  translations?: Record<string, Partial<Pick<PageBlock,"title"|"description"|"eyebrow"|"ctaLabel">>>;
};

type BlockCopy = Pick<PageBlock,"title"|"description"> & Partial<Pick<PageBlock,"eyebrow"|"ctaLabel">>;
export const BLOCK_COPY: Record<PageBlockType, Record<string,BlockCopy>> = {
  Hero:{en:{eyebrow:"Independent design · Printed in Maia",title:"Porto stories you can wear.",description:"Original designs, local humour and a Link Label that opens something unexpected. Choose the artwork, colour and piece that feels like yours.",ctaLabel:"Find your design"},pt:{eyebrow:"Design independente · Impresso na Maia",title:"Histórias do Porto para vestir.",description:"Designs originais, humor local e uma Link Label que abre algo inesperado. Escolhe a arte, a cor e a peça que têm a tua cara.",ctaLabel:"Encontrar o meu design"},es:{eyebrow:"Diseño independiente · Impreso en Maia",title:"Historias de Oporto para vestir.",description:"Diseños originales, humor local y una Link Label que abre algo inesperado. Elige el arte, el color y la prenda que te representan.",ctaLabel:"Encontrar mi diseño"},de:{eyebrow:"Unabhängiges Design · Gedruckt in Maia",title:"Geschichten aus Porto zum Anziehen.",description:"Originelle Designs, lokaler Humor und ein Link Label, das Unerwartetes öffnet. Wähle Motiv, Farbe und Produkt, die zu dir passen.",ctaLabel:"Mein Design finden"},fr:{eyebrow:"Design indépendant · Imprimé à Maia",title:"Des histoires de Porto à porter.",description:"Des créations originales, un humour local et un Link Label qui ouvre une surprise. Choisissez l’illustration, la couleur et la pièce qui vous ressemblent.",ctaLabel:"Trouver mon design"}},
  Produtos:{en:{eyebrow:"Made for people, not algorithms",title:"Find the one you cannot leave behind",description:"Start with the design. Preview it in different colours, choose your favourite piece and we will print it locally for you."},pt:{eyebrow:"Feito para pessoas, não para algoritmos",title:"Encontra aquele que não consegues deixar para trás",description:"Começa pelo design. Experimenta várias cores, escolhe a tua peça preferida e nós imprimimo-la localmente para ti."},es:{eyebrow:"Hecho para personas, no para algoritmos",title:"Encuentra el que no puedes dejar atrás",description:"Empieza por el diseño. Pruébalo en varios colores, elige tu prenda favorita y la imprimimos localmente para ti."},de:{eyebrow:"Für Menschen gemacht, nicht für Algorithmen",title:"Finde das Motiv, das du nicht zurücklassen kannst",description:"Beginne mit dem Design, teste verschiedene Farben und wähle dein Lieblingsprodukt. Wir drucken es lokal für dich."},fr:{eyebrow:"Créé pour les gens, pas pour les algorithmes",title:"Trouvez celui que vous ne pourrez pas laisser",description:"Commencez par le design, essayez plusieurs couleurs et choisissez votre pièce. Nous l’imprimons localement pour vous."}},
  Coleções:{en:{eyebrow:"Explore by mood",title:"Cats, Quotes & Jars",description:"Three collections, one local point of view."},pt:{eyebrow:"Explora por tema",title:"Gatos, Frases e Frascos",description:"Três coleções, um ponto de vista local."},es:{eyebrow:"Explora por tema",title:"Gatos, Frases y Frascos",description:"Tres colecciones, un punto de vista local."},de:{eyebrow:"Nach Stimmung entdecken",title:"Katzen, Sprüche & Gläser",description:"Drei Kollektionen, eine lokale Perspektive."},fr:{eyebrow:"Explorer par univers",title:"Chats, Citations et Bocaux",description:"Trois collections, un point de vue local."}},
  "Logo aleatório":{en:{eyebrow:"Our logo is a portal",title:"Scan it. Something different appears every time.",description:"The Made in Maia symbol opens a rotating collection of local stories, images, ideas and surprises.",ctaLabel:"Try it now"},pt:{eyebrow:"O nosso logótipo é um portal",title:"Lê o código. Aparece algo diferente de cada vez.",description:"O símbolo Made in Maia abre uma coleção rotativa de histórias locais, imagens, ideias e surpresas.",ctaLabel:"Experimentar agora"},es:{eyebrow:"Nuestro logotipo es un portal",title:"Escanéalo. Cada vez aparece algo diferente.",description:"El símbolo de Made in Maia abre una colección cambiante de historias, imágenes, ideas y sorpresas locales.",ctaLabel:"Probar ahora"},de:{eyebrow:"Unser Logo ist ein Portal",title:"Scanne es. Jedes Mal erscheint etwas anderes.",description:"Das Made-in-Maia-Symbol öffnet wechselnde lokale Geschichten, Bilder, Ideen und Überraschungen.",ctaLabel:"Jetzt ausprobieren"},fr:{eyebrow:"Notre logo est un portail",title:"Scannez-le. Une surprise différente apparaît à chaque fois.",description:"Le symbole Made in Maia ouvre une collection changeante d’histoires, d’images, d’idées et de surprises locales.",ctaLabel:"Essayer maintenant"}},
  Localização:{en:{eyebrow:"Find us in Porto",title:"The building is part of the story.",description:"Visit Made in Maia at Mercado Ferreira Borges / Hard Club, inside River Market.",ctaLabel:"Open River Market"},pt:{eyebrow:"Encontra-nos no Porto",title:"O edifício faz parte da história.",description:"Visita a Made in Maia no Mercado Ferreira Borges / Hard Club, dentro do River Market.",ctaLabel:"Abrir River Market"},es:{eyebrow:"Encuéntranos en Oporto",title:"El edificio forma parte de la historia.",description:"Visita Made in Maia en Mercado Ferreira Borges / Hard Club, dentro de River Market.",ctaLabel:"Abrir River Market"},de:{eyebrow:"Finde uns in Porto",title:"Das Gebäude ist Teil der Geschichte.",description:"Besuche Made in Maia im Mercado Ferreira Borges / Hard Club, im River Market.",ctaLabel:"River Market öffnen"},fr:{eyebrow:"Retrouvez-nous à Porto",title:"Le bâtiment fait partie de l’histoire.",description:"Rendez visite à Made in Maia au Mercado Ferreira Borges / Hard Club, dans le River Market.",ctaLabel:"Ouvrir River Market"}},
  Linktree:{en:{eyebrow:"Stay close",title:"Markets, people and new drops.",description:"Follow the project, discover our markets or join the team.",ctaLabel:"Open our links"},pt:{eyebrow:"Fica por perto",title:"Mercados, pessoas e novidades.",description:"Segue o projeto, descobre os nossos mercados ou junta-te à equipa.",ctaLabel:"Abrir os nossos links"},es:{eyebrow:"Sigue cerca",title:"Mercados, personas y novedades.",description:"Sigue el proyecto, descubre nuestros mercados o únete al equipo.",ctaLabel:"Abrir nuestros enlaces"},de:{eyebrow:"Bleib in Kontakt",title:"Märkte, Menschen und Neuheiten.",description:"Folge dem Projekt, entdecke unsere Märkte oder werde Teil des Teams.",ctaLabel:"Unsere Links öffnen"},fr:{eyebrow:"Restons proches",title:"Marchés, rencontres et nouveautés.",description:"Suivez le projet, découvrez nos marchés ou rejoignez l’équipe.",ctaLabel:"Ouvrir nos liens"}},
  Banner:{en:{eyebrow:"Wearable links",title:"Your clothes should lead somewhere unexpected.",description:"Every Made in Maia Link Label unlocks a different story, image, video or internet gem whenever you open it.",ctaLabel:"Try the Link Label"},pt:{eyebrow:"Links para vestir",title:"A tua roupa devia levar-te a algum lugar inesperado.",description:"Cada Link Label Made in Maia abre uma história, imagem, vídeo ou pérola da internet diferente sempre que a visitas.",ctaLabel:"Experimentar a Link Label"},es:{eyebrow:"Enlaces para vestir",title:"Tu ropa debería llevarte a un lugar inesperado.",description:"Cada Link Label abre una historia, imagen, vídeo o joya de internet diferente cada vez.",ctaLabel:"Probar Link Label"},de:{eyebrow:"Links zum Anziehen",title:"Deine Kleidung sollte dich irgendwohin Unerwartetes führen.",description:"Jedes Link Label öffnet bei jedem Besuch eine andere Geschichte, ein Bild, Video oder Internetfundstück.",ctaLabel:"Link Label testen"},fr:{eyebrow:"Des liens à porter",title:"Vos vêtements devraient vous mener quelque part d’inattendu.",description:"Chaque Link Label révèle une histoire, image, vidéo ou pépite du web différente à chaque visite.",ctaLabel:"Essayer Link Label"}},
  Texto:{en:{title:"Made in Maia",description:"Original ideas, made locally."},pt:{title:"Made in Maia",description:"Ideias originais, feitas localmente."},es:{title:"Made in Maia",description:"Ideas originales, hechas localmente."},de:{title:"Made in Maia",description:"Originelle Ideen, lokal gemacht."},fr:{title:"Made in Maia",description:"Des idées originales, créées localement."}},
  "Post Title":{en:{title:"Dynamic post title",description:""},pt:{title:"Título dinâmico",description:""},es:{title:"Título dinámico",description:""},de:{title:"Dynamischer Titel",description:""},fr:{title:"Titre dynamique",description:""}},
};

export function localizedBlock(block:PageBlock, locale:string):PageBlock {
  if (locale === "en") return block;
  const stored = block.translations?.[locale];
  if (stored && Object.values(stored).some(Boolean)) return { ...block, ...stored };
  const fallback = BLOCK_COPY[block.type]?.[locale];
  if (!fallback) return block;
  return { ...block, ...fallback };
}

export const DEFAULT_PAGE_BLOCKS: PageBlock[] = [
  { id:1, type:"Hero", ...BLOCK_COPY.Hero.en, translations:Object.fromEntries(Object.entries(BLOCK_COPY.Hero).filter(([key])=>key!=="en")), ctaUrl:"#novidades", background:"var(--brand)", textColor:"#ffffff", width:"full", align:"left", spacing:"large" },
  { id:2, type:"Produtos", ...BLOCK_COPY.Produtos.en, translations:Object.fromEntries(Object.entries(BLOCK_COPY.Produtos).filter(([key])=>key!=="en")), background:"var(--paper)", textColor:"var(--foreground)", width:"content", align:"left", spacing:"normal" },
  { id:3, type:"Banner", ...BLOCK_COPY.Banner.en, translations:Object.fromEntries(Object.entries(BLOCK_COPY.Banner).filter(([key])=>key!=="en")), ctaUrl:"/linklabel", background:"var(--accent-brand)", textColor:"var(--ink)", width:"content", align:"left", spacing:"normal" },
  { id:4, type:"Coleções", eyebrow:"Explore by mood", title:"Cats, Quotes & Jars", description:"Three collections, one local point of view.", background:"var(--surface)", textColor:"var(--foreground)", width:"content", align:"left", spacing:"large" },
  { id:5, type:"Logo aleatório", eyebrow:"Link Label", title:"Made in Maia is a label with a link.", description:"Every piece opens a different story, image, video, idea or surprise.", ctaLabel:"Open Link Label", ctaUrl:"/linklabel", background:"var(--accent-brand)", textColor:"var(--ink)", width:"full", align:"center", spacing:"large" },
  { id:6, type:"Localização", eyebrow:"Find us in Porto", title:"The building is part of the story.", description:"Visit Made in Maia at Mercado Ferreira Borges / Hard Club, inside River Market.", ctaLabel:"Open River Market", ctaUrl:"https://rivermarket.pt", background:"#8d2b20", textColor:"#ffffff", width:"full", align:"left", spacing:"large" },
  { id:7, type:"Linktree", eyebrow:"Stay close", title:"Markets, people and new drops.", description:"Follow the project, discover our markets or join the team.", ctaLabel:"Open our links", ctaUrl:"/links", background:"var(--ink)", textColor:"#ffffff", width:"content", align:"center", spacing:"normal" },
];

export const DEFAULT_COLLECTION_TEMPLATE_BLOCKS: PageBlock[] = [
  { id:101, type:"Hero", eyebrow:"Collection", title:"{{collection}}", description:"{{count}} designs", background:"var(--surface)", textColor:"var(--foreground)", width:"content", align:"left", spacing:"compact" },
  { id:102, type:"Produtos", eyebrow:"Browse the collection", title:"Designs in {{collection}}", description:"Choose a design, colour and support.", background:"var(--paper)", textColor:"var(--foreground)", width:"content", align:"left", spacing:"normal" },
];

const LEGACY_HOME_TITLES: Partial<Record<PageBlockType,string[]>> = {
  Hero:["Wear an idea."],
  Produtos:["New in the shop"],
  Banner:["A label with a different link every time."],
};

export function withRequiredHomeBlocks(blocks: PageBlock[]) {
  const required:PageBlockType[] = ["Coleções","Logo aleatório","Localização","Linktree"];
  const upgraded=blocks.map((block)=>LEGACY_HOME_TITLES[block.type]?.includes(block.title)?{...block,...BLOCK_COPY[block.type].en,translations:Object.fromEntries(Object.entries(BLOCK_COPY[block.type]).filter(([key])=>key!=="en"))}:block);
  return [...upgraded, ...DEFAULT_PAGE_BLOCKS.filter((block)=>required.includes(block.type)&&!upgraded.some((item)=>item.type===block.type))];
}
