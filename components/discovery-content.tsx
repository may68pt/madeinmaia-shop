import Image from "next/image";

export type DiscoveryEntry = {
  title: string;
  type: string;
  body: string;
  category: string;
  tags: string[];
  mediaUrl: string | null;
};

function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const id = url.hostname.includes("youtu.be")
      ? url.pathname.slice(1)
      : url.searchParams.get("v") ?? (url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : "");
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export function DiscoveryContent({ entry }: { entry: DiscoveryEntry }) {
  const youtubeUrl = entry.type === "youtube" && entry.mediaUrl ? youtubeEmbedUrl(entry.mediaUrl) : null;
  const isVisual = ["image", "meme", "gif"].includes(entry.type);
  const isEditorial = ["article", "blog", "text", "link"].includes(entry.type);
  return (
    <section className="mim-link-label-entry relative flex min-h-dvh flex-col bg-[#090909]">
      {entry.mediaUrl && isVisual && <div className="absolute inset-0"><Image src={entry.mediaUrl} alt={entry.title} fill sizes="100vw" className={entry.type === "image" ? "object-cover" : "object-contain"} unoptimized priority /></div>}
      {entry.mediaUrl && entry.type === "video" && (
        <video className="absolute inset-0 h-full w-full bg-black object-contain" controls playsInline autoPlay muted loop preload="auto" src={entry.mediaUrl} />
      )}
      {youtubeUrl && (
        <div className="absolute inset-0 grid place-items-center bg-black">
          <iframe className="aspect-video h-auto max-h-dvh w-full" src={`${youtubeUrl}?autoplay=1&rel=0`} title={entry.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        </div>
      )}
      {isEditorial&&<div className="relative z-10 my-auto mx-auto w-full max-w-4xl px-5 py-28 sm:px-10"><p className="text-xs font-black uppercase tracking-[.2em] text-[#d8ff42]">{entry.category}</p><h1 className="mt-4 text-[clamp(3rem,10vw,7.5rem)] font-black uppercase leading-[.82] tracking-[-.07em]">{entry.title}</h1><div className="mt-8 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-white/72 sm:text-2xl">{entry.body}</div>{entry.mediaUrl&&<div className="relative mt-10 aspect-video overflow-hidden rounded-2xl bg-white/5"><Image src={entry.mediaUrl} alt={entry.title} fill sizes="896px" className="object-cover" unoptimized /></div>}</div>}
      {!isEditorial&&entry.title&&<div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 to-transparent px-5 pb-20 pt-28 sm:px-8"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#d8ff42]">{entry.category}</p><h1 className="mt-2 max-w-4xl text-2xl font-black uppercase leading-none tracking-[-.04em] sm:text-4xl">{entry.title}</h1></div>}
    </section>
  );
}
