export type NavigationItem = {
  id: string;
  label: string;
  url: string;
  visible: boolean;
};

export const DEFAULT_NAVIGATION: NavigationItem[] = [
  { id: "new", label: "New", url: "/loja#novidades", visible: true },
  { id: "collections", label: "Collections", url: "/loja#colecoes", visible: true },
  { id: "discover", label: "Discover", url: "/descobre", visible: true },
  { id: "brand", label: "The brand", url: "/marca", visible: true },
];

