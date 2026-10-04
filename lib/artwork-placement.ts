export type ArtworkPlacement = { x:number; y:number; width:number; height:number };
export type ArtworkPlacements = Record<string,ArtworkPlacement>;

const defaults:Record<string,ArtworkPlacement> = {
  "tshirt-150":{x:35,y:22,width:30,height:30},
  "tshirt-190":{x:35,y:22,width:30,height:30},
  hoodie:{x:34,y:27,width:32,height:27},
  "long-sleeve":{x:34,y:22,width:32,height:30},
  "tote-bag":{x:29,y:40,width:42,height:32},
};

export function artworkPlacement(supportId:string, placements?:ArtworkPlacements):ArtworkPlacement {
  return placements?.[supportId] ?? defaults[supportId] ?? defaults["tshirt-150"];
}

export function clampPlacement(value:ArtworkPlacement):ArtworkPlacement {
  const width=Math.min(90,Math.max(8,value.width));
  const height=Math.min(90,Math.max(8,value.height));
  return {x:Math.min(100-width,Math.max(0,value.x)),y:Math.min(100-height,Math.max(0,value.y)),width,height};
}
