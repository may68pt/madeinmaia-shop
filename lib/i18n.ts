export const LOCALES = ["en", "pt", "es", "de", "fr"] as const;
export type Locale = typeof LOCALES[number];

export const UI_STRINGS: Record<Locale, Record<string, string>> = {
  en:{announcement:"Made in Maia · Free shipping in Portugal from €45",new:"New",choose:"Choose options",search:"Search designs",bag:"Your bag",checkout:"Continue to checkout",collections:"Collections",brand:"The brand",discover:"Discover",where:"Find us",kids:"Kids",adults:"Adults",size:"Size",colour:"Colour",support:"Product",add:"Add to bag"},
  pt:{announcement:"Produzido na Maia · Envio gratuito em Portugal a partir de 45 €",new:"Novo",choose:"Escolher opções",search:"Pesquisar designs",bag:"O teu saco",checkout:"Continuar para pagamento",collections:"Coleções",brand:"A marca",discover:"Descobre",where:"Onde estamos",kids:"Criança",adults:"Adulto",size:"Tamanho",colour:"Cor",support:"Produto",add:"Adicionar ao saco"},
  es:{announcement:"Hecho en Maia · Envío gratuito en Portugal desde 45 €",new:"Nuevo",choose:"Elegir opciones",search:"Buscar diseños",bag:"Tu bolsa",checkout:"Continuar al pago",collections:"Colecciones",brand:"La marca",discover:"Descubre",where:"Dónde estamos",kids:"Niños",adults:"Adultos",size:"Talla",colour:"Color",support:"Producto",add:"Añadir a la bolsa"},
  de:{announcement:"Made in Maia · Kostenloser Versand in Portugal ab 45 €",new:"Neu",choose:"Optionen wählen",search:"Designs suchen",bag:"Deine Tasche",checkout:"Zur Kasse",collections:"Kollektionen",brand:"Die Marke",discover:"Entdecken",where:"Wo wir sind",kids:"Kinder",adults:"Erwachsene",size:"Größe",colour:"Farbe",support:"Produkt",add:"In den Warenkorb"},
  fr:{announcement:"Fabriqué à Maia · Livraison gratuite au Portugal dès 45 €",new:"Nouveau",choose:"Choisir les options",search:"Rechercher des designs",bag:"Votre sac",checkout:"Passer au paiement",collections:"Collections",brand:"La marque",discover:"Découvrir",where:"Où nous trouver",kids:"Enfants",adults:"Adultes",size:"Taille",colour:"Couleur",support:"Produit",add:"Ajouter au sac"},
};

export function translatedName(name:string, translations:Record<string,string>|undefined, locale:Locale) {
  return locale === "en" ? name : translations?.[locale]?.trim() || name;
}
