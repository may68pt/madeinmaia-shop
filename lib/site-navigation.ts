export type NavigationItem = {
  id: string;
  label: string;
  url: string;
  visible: boolean;
  children?: NavigationItem[];
};

export const DEFAULT_NAVIGATION: NavigationItem[] = [
  { id: "new", label: "New", url: "/loja#novidades", visible: true },
  { id: "collections", label: "Collections", url: "/loja#colecoes", visible: true, children: [
    { id:"collection-cats", label:"Cats", url:"/loja?q=Cats", visible:true },
    { id:"collection-quotes", label:"Quotes", url:"/loja?q=Quotes", visible:true },
    { id:"collection-jars", label:"Jars", url:"/loja?q=Jars", visible:true },
  ] },
  { id: "discover", label: "Discover", url: "/descobre", visible: true },
  { id: "brand", label: "The brand", url: "/marca", visible: true },
];
