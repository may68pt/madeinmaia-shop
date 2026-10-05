export type NavigationItem = {
  id: string;
  label: string;
  url: string;
  visible: boolean;
  children?: NavigationItem[];
};

export const DEFAULT_NAVIGATION: NavigationItem[] = [
  { id: "new", label: "New", url: "/loja#novidades", visible: true },
  { id: "collections", label: "Collections", url: "/colecoes", visible: true, children: [
    { id:"collection-cats", label:"Cats", url:"/colecao/cats", visible:true },
    { id:"collection-quotes", label:"Quotes", url:"/colecao/quotes", visible:true },
    { id:"collection-jars", label:"Jars", url:"/colecao/jars", visible:true },
  ] },
  { id: "discover", label: "Discover", url: "/descobre", visible: true },
  { id: "blog", label: "Blog", url: "/blog", visible: true },
  { id: "brand", label: "The brand", url: "/marca", visible: true },
];
