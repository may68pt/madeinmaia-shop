-- Editorial SEO is stored with the lead block so it remains editable with the article.
UPDATE "pages"
SET "blocks" = jsonb_set(
  "blocks",
  '{0}',
  ("blocks"->0) || jsonb_build_object(
    'seoTitle', left("title" || ' | Made in Maia Guide', 60),
    'seoDescription', left(coalesce("blocks"->0->>'description', ''), 155),
    'seoKeywords', CASE "slug"
      WHEN 'blog-porto-in-one-day-without-racing' THEN '["Porto one day itinerary","things to do in Porto","Porto walking route","Porto travel guide"]'::jsonb
      WHEN 'blog-porto-markets-iron-and-local-life' THEN '["Porto markets","Mercado do Bolhão","Mercado Ferreira Borges","local shopping Porto"]'::jsonb
      WHEN 'blog-porto-viewpoints-for-every-kind-of-day' THEN '["best viewpoints Porto","Porto sunset","Porto gardens","Porto travel guide"]'::jsonb
      WHEN 'blog-getting-around-porto-without-losing-the-day' THEN '["Porto transport","Porto Metro","Porto airport to city","getting around Porto"]'::jsonb
      WHEN 'blog-why-porto-looks-like-porto' THEN '["Porto architecture","Porto azulejos","iron architecture Porto","Porto identity"]'::jsonb
      WHEN 'blog-what-and-where-is-maia' THEN '["what is Maia Portugal","Maia Porto","visit Maia","Porto metropolitan area"]'::jsonb
      WHEN 'blog-terra-da-maia-before-the-city' THEN '["Terra da Maia","history of Maia Portugal","Mendes da Maia","Maia heritage"]'::jsonb
      WHEN 'blog-green-maia-parks-routes-and-water' THEN '["parks in Maia","Parque de Avioso","Quinta da Gruta","walking routes Maia"]'::jsonb
      WHEN 'blog-moreira-from-monastery-to-airport' THEN '["Moreira da Maia","Porto airport Maia","Mosteiro de Moreira","visit Maia"]'::jsonb
      WHEN 'blog-how-to-read-maias-architecture' THEN '["Maia architecture","Torre Lidador","contemporary architecture Portugal","visit Maia"]'::jsonb
      WHEN 'blog-maia-traditions-made-by-hand' THEN '["Maia traditions","Feira da Maia","Terra da Maia museum","Portuguese crafts"]'::jsonb
      ELSE '[]'::jsonb
    END
  )
)
WHERE "slug" IN (
  'blog-porto-in-one-day-without-racing','blog-porto-markets-iron-and-local-life',
  'blog-porto-viewpoints-for-every-kind-of-day','blog-getting-around-porto-without-losing-the-day',
  'blog-why-porto-looks-like-porto','blog-what-and-where-is-maia',
  'blog-terra-da-maia-before-the-city','blog-green-maia-parks-routes-and-water',
  'blog-moreira-from-monastery-to-airport','blog-how-to-read-maias-architecture',
  'blog-maia-traditions-made-by-hand'
);

-- Extra editorial depth and internal links for the Maia series.
UPDATE "pages" SET "blocks" = "blocks" || $json$[
  {"id":22001,"type":"Texto","eyebrow":"Plan your visit","title":"Is Maia worth visiting from Porto?","description":"Yes — especially if you want to understand the territory beyond Porto’s postcard centre. The metro makes Maia an easy half-day trip for contemporary architecture, local markets, parks and the museum in Castêlo da Maia. It is also the right context for the airport most visitors already use.","ctaLabel":"Read the history behind Maia","ctaUrl":"/blog/terra-da-maia-before-the-city","background":"#171715","textColor":"#ffffff","width":"narrow","align":"left","spacing":"normal"}
]$json$::jsonb WHERE "slug"='blog-what-and-where-is-maia';

UPDATE "pages" SET "blocks" = "blocks" || $json$[
  {"id":22002,"type":"Texto","eyebrow":"Read the landscape","title":"Where can you still see Terra da Maia today?","description":"Start at the territory museum in Castêlo da Maia, then compare its agricultural collections with the rural lanes around Santo Ovídio and the monastic landscape of Moreira. The old territory survives less as a border than as a pattern of farms, parishes, watercourses and shared memory.","ctaLabel":"Walk through green Maia","ctaUrl":"/blog/green-maia-parks-routes-and-water","background":"var(--paper)","textColor":"var(--foreground)","width":"narrow","align":"left","spacing":"normal"}
]$json$::jsonb WHERE "slug"='blog-terra-da-maia-before-the-city';

UPDATE "pages" SET "blocks" = "blocks" || $json$[
  {"id":22003,"type":"Texto","eyebrow":"A useful half day","title":"A simple green Maia route","description":"Begin at Quinta da Gruta and the museum in Castêlo da Maia, then continue to Parque de Avioso if you have a car or time for a local connection. Wear walking shoes, carry water and check official opening information before travelling: environmental and museum schedules can change seasonally.","ctaLabel":"Understand Maia’s architecture","ctaUrl":"/blog/how-to-read-maias-architecture","background":"#171715","textColor":"#ffffff","width":"narrow","align":"left","spacing":"normal"}
]$json$::jsonb WHERE "slug"='blog-green-maia-parks-routes-and-water';

UPDATE "pages" SET "blocks" = "blocks" || $json$[
  {"id":22004,"type":"Texto","eyebrow":"Before you transfer","title":"What can you visit near Porto Airport?","description":"Moreira’s heritage is close in geographic terms but the airport roads make walking routes uneven. Treat the monastery and local centre as a planned stop rather than a luggage-hour detour. Metro Line E remains the simplest connection between the terminal, central Maia and Porto.","ctaLabel":"Read our Porto transport guide","ctaUrl":"/blog/getting-around-porto-without-losing-the-day","background":"var(--paper)","textColor":"var(--foreground)","width":"narrow","align":"left","spacing":"normal"}
]$json$::jsonb WHERE "slug"='blog-moreira-from-monastery-to-airport';

UPDATE "pages" SET "blocks" = "blocks" || $json$[
  {"id":22005,"type":"Texto","eyebrow":"Architecture route","title":"Three stops that explain contemporary Maia","description":"Use Torre Lidador to understand the metropolitan scale, Praça Dr. José Vieira de Carvalho to read civic space at ground level, and Quinta da Gruta to see adaptive reuse. Together they show architecture working as landmark, public room and environmental infrastructure.","ctaLabel":"Start with our Maia overview","ctaUrl":"/blog/what-and-where-is-maia","background":"#171715","textColor":"#ffffff","width":"narrow","align":"left","spacing":"normal"}
]$json$::jsonb WHERE "slug"='blog-how-to-read-maias-architecture';

UPDATE "pages" SET "blocks" = "blocks" || $json$[
  {"id":22006,"type":"Texto","eyebrow":"Buy with context","title":"Markets are living heritage, not stage sets","description":"At Maia’s fairs, the useful things matter: food in season, household goods, flowers, textiles and conversation between regular customers. Visit respectfully, ask before photographing people and choose something made or grown locally when you can.","ctaLabel":"Discover Maia beyond the market","ctaUrl":"/blog/what-and-where-is-maia","background":"var(--paper)","textColor":"var(--foreground)","width":"narrow","align":"left","spacing":"normal"}
]$json$::jsonb WHERE "slug"='blog-maia-traditions-made-by-hand';

INSERT INTO "pages" ("slug", "title", "blocks", "status", "updated_at") VALUES
('blog-river-market-porto-independent-design', 'River Market Porto: independent design inside an iron landmark', $json$[
  {"id":22101,"type":"Hero","eyebrow":"Porto markets","title":"River Market Porto: independent design inside an iron landmark","description":"Meet Made in Maia and other independent projects inside Mercado Ferreira Borges — the red iron building between Ribeira, Palácio da Bolsa and the Hard Club.","seoTitle":"River Market Porto: Local Design at Ferreira Borges","seoDescription":"Visit River Market inside Porto’s Mercado Ferreira Borges for independent design, Made in Maia products and one of the city’s great iron landmarks.","seoKeywords":["River Market Porto","Mercado Ferreira Borges shops","independent design Porto","Made in Maia Porto","shopping in Ribeira"],"imageUrl":"/blog/porto-identity.webp","imageAlt":"Red iron façade and glass galleries of Mercado Ferreira Borges in Porto","imageCaption":"River Market lives inside one of Porto’s most recognisable iron buildings.","imageCredit":"Photo: Matt Kieffer · CC BY-SA 2.0 · Wikimedia Commons","imageCreditUrl":"https://commons.wikimedia.org/wiki/File:Mercado_Ferreira_Borges,_Porto_(38195450956).jpg","background":"#8d2b20","textColor":"#ffffff","width":"content","align":"left","spacing":"large"},
  {"id":22102,"type":"Texto","eyebrow":"Why go","title":"A place to find independent Porto beyond the souvenir formula","description":"River Market brings small brands and original work into the historic centre. For visitors, it is a chance to meet the people behind the objects and choose something with a real point of view. For Made in Maia, it is where our wearable links, local humour and graphic designs can be handled, discussed and tried in person.","ctaLabel":"Explore Made in Maia designs","ctaUrl":"/loja","background":"var(--paper)","textColor":"var(--foreground)","width":"narrow","align":"left","spacing":"normal"},
  {"id":22103,"type":"Texto","eyebrow":"The building","title":"Mercado Ferreira Borges was built to be a market in 1885","description":"Porto City Council commissioned Mercado Ferreira Borges to replace the old Ribeira market. Its original market life was brief, but the building survived through changing uses. The red-painted iron structure is now one of the clearest examples of nineteenth-century iron architecture in Porto and has been adapted as a cultural and events venue.","ctaLabel":"Read the official Visit Porto entry","ctaUrl":"https://visitporto.travel/en-GB/poi/5cd04b4ef979e00001fe4824","background":"#171715","textColor":"#ffffff","width":"narrow","align":"left","spacing":"normal"},
  {"id":22104,"type":"Texto","eyebrow":"Culture under one roof","title":"The Hard Club made the old market a working cultural building","description":"Hard Club opened here in September 2010 after nine years in Vila Nova de Gaia. Its concert halls, exhibitions, fairs, performances and public main floor give the market a contemporary life. River Market belongs to that same useful mixture: retail, culture, architecture and people sharing one building instead of becoming separate tourist attractions.","ctaLabel":"See the Hard Club programme","ctaUrl":"https://www.hardclubporto.com/","background":"#b9ff27","textColor":"#11110f","width":"narrow","align":"left","spacing":"normal"},
  {"id":22105,"type":"Texto","eyebrow":"Find it","title":"In the historic centre, between major Porto landmarks","description":"Mercado Ferreira Borges stands at Rua da Bolsa 19, beside Praça do Infante D. Henrique and close to Palácio da Bolsa, Igreja de São Francisco and the Ribeira riverfront. São Bento station is within walking distance, but the historic-centre slopes and stone paving reward comfortable shoes. Check River Market and venue channels before travelling for current shop and event hours.","ctaLabel":"Open River Market","ctaUrl":"https://rivermarket.pt","background":"var(--paper)","textColor":"var(--foreground)","width":"narrow","align":"left","spacing":"normal"},
  {"id":22106,"type":"Texto","eyebrow":"Made in Maia at River Market","title":"Choose a design — then follow the link","description":"Our products start with an image, but they do not end there. Each Made in Maia piece carries a Link Label that opens rotating digital content: art, stories, videos, internet finds and local knowledge. At River Market you can see the print and garment in person, ask about colours and supports, and discover why we call it a label with a link.","ctaLabel":"Try the Link Label","ctaUrl":"/linklabel","background":"#171715","textColor":"#ffffff","width":"narrow","align":"left","spacing":"normal"},
  {"id":22107,"type":"Texto","eyebrow":"Build a short route","title":"Combine River Market with architecture, food and the river","description":"Start at São Bento, walk down through the historic centre to Mercado Ferreira Borges, then continue to São Francisco, Palácio da Bolsa and Ribeira. The route is compact but dense: allow time to look inside buildings, speak with makers and stop rather than treating every place as a photograph checkpoint.","ctaLabel":"Read our one-day Porto route","ctaUrl":"/blog/porto-in-one-day-without-racing","background":"#8d2b20","textColor":"#ffffff","width":"narrow","align":"left","spacing":"normal"}
]$json$::jsonb, 'published', now())
ON CONFLICT ("slug") DO UPDATE SET "title"=excluded."title", "blocks"=excluded."blocks", "status"=excluded."status", "updated_at"=now();
