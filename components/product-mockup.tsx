import Image from "next/image";
import type { CSSProperties } from "react";
import { productColorHex } from "@/lib/product-colors";
import { artworkPlacement, type ArtworkPlacements } from "@/lib/artwork-placement";

export function ProductMockup({ artwork, color, name, priority = false, baseImage, templateImage, supportId = "tshirt-150", printColor = "original", placements }: { artwork: string; color: string; name: string; priority?: boolean; baseImage?: string; templateImage?: string; supportId?: string; printColor?: "original" | "black" | "white"; placements?:ArtworkPlacements }) {
  const colorHex = productColorHex(color);
  const artworkStyle = printColor === "black"
    ? { filter: "grayscale(1) brightness(0)" }
    : printColor === "white"
      ? { filter: "grayscale(1) brightness(0) invert(1)" }
      : undefined;
  if (!/\.png(?:$|\?)/i.test(artwork))
    return <Image src={artwork} alt={`T-shirt ${name}`} fill sizes="(min-width: 1024px) 55vw, 100vw" unoptimized={artwork.startsWith("http")} className="object-cover" priority={priority} />;

  if (templateImage) {
    const placement = artworkPlacement(supportId, placements);
    const printArea = { top:`${placement.y}%`,left:`${placement.x}%`,width:`${placement.width}%`,height:`${placement.height}%` };
    const maskStyle = {
      backgroundColor: colorHex,
      maskImage: `url(${templateImage})`,
      WebkitMaskImage: `url(${templateImage})`,
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
      maskSize: "contain",
      WebkitMaskSize: "contain",
    } as CSSProperties;
    return <div className="absolute inset-0 overflow-hidden bg-[#e9e7e1]">
      <div className="absolute inset-[5%] transition-colors duration-500" style={maskStyle} />
      <div className="absolute inset-[5%] mix-blend-multiply"><Image src={templateImage} alt={`${color} ${name}`} fill sizes="(min-width: 1024px) 55vw, 100vw" unoptimized className="object-contain grayscale" priority={priority} /></div>
      <div className="absolute" style={printArea}><Image src={artwork} alt={`Design ${name}`} fill sizes="280px" unoptimized={artwork.startsWith("http")} className="object-contain drop-shadow-sm transition-[filter,transform] duration-300" style={artworkStyle} priority={priority} /></div>
    </div>;
  }

  if (baseImage) return <div className="absolute inset-0 bg-[#d8d7d2]"><Image src={baseImage} alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" unoptimized className="object-contain transition-opacity duration-300" priority={priority} /><div className="absolute left-[35%] top-[30%] h-[28%] w-[30%]"><Image src={artwork} alt={`Design ${name}`} fill sizes="280px" unoptimized={artwork.startsWith("http")} className="object-contain transition-[filter,transform] duration-300" style={artworkStyle} priority={priority} /></div></div>;

  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[#e9e7e1] p-[6%]">
      <div className="relative aspect-[4/5] h-full max-h-[820px] w-full max-w-[650px]">
        <svg viewBox="0 0 800 1000" className="absolute inset-0 h-full w-full drop-shadow-2xl" aria-hidden="true">
          <path d="M285 88c30 55 200 55 230 0l155 74 105 175-112 70-51-82v594H188V325l-51 82-112-70 105-175 155-74Z" fill={colorHex} stroke="rgba(0,0,0,.16)" strokeWidth="5" style={{transition:"fill 360ms ease"}} />
          <path d="M285 88c18 92 212 92 230 0-28-14-55-24-82-29-9 55-57 55-66 0-27 5-54 15-82 29Z" fill="rgba(0,0,0,.12)" />
          <path d="M189 325 162 494M611 325l27 169" fill="none" stroke="rgba(0,0,0,.10)" strokeWidth="4" />
        </svg>
        <div className="absolute left-[30%] top-[26%] h-[34%] w-[40%]">
          <Image src={artwork} alt={`Design ${name}`} fill sizes="300px" unoptimized={artwork.startsWith("http")} className="object-contain transition-[filter] duration-300" style={artworkStyle} priority={priority} />
        </div>
      </div>
    </div>
  );
}
