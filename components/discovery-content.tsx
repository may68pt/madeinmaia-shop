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
  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[.12em]">{entry.category}</span>
        {entry.tags.map((tag) => <span key={tag} className="text-xs font-bold text-white/55">#{tag}</span>)}
      </div>
      <div className={`mt-7 max-w-2xl whitespace-pre-line leading-relaxed text-white/85 ${entry.type === "article" ? "text-lg sm:text-xl" : "text-lg"}`}>{entry.body}</div>
      {entry.mediaUrl && ["image", "meme", "gif"].includes(entry.type) && (
        <div className="relative mt-8 aspect-video overflow-hidden bg-white/10">
          <Image src={entry.mediaUrl} alt={entry.title} fill sizes="(min-width: 896px) 768px, 100vw" className={entry.type === "meme" || entry.type === "gif" ? "object-contain" : "object-cover"} unoptimized />
        </div>
      )}
      {entry.mediaUrl && entry.type === "video" && (
        <video className="mt-8 w-full bg-black" controls playsInline preload="metadata" src={entry.mediaUrl} />
      )}
      {youtubeUrl && (
        <div className="mt-8 aspect-video overflow-hidden bg-black">
          <iframe className="h-full w-full" src={youtubeUrl} title={entry.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        </div>
      )}
    </>
  );
}

