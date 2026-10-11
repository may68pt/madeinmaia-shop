type LinkLabelTypeIconProps = {
  type: string;
  className?: string;
};

const labels: Record<string, string> = {
  article: "Article",
  text: "Short text",
  image: "Image",
  meme: "Meme",
  gif: "GIF",
  video: "Video",
  youtube: "YouTube",
  link: "Redirect link",
};

export function LinkLabelTypeIcon({ type, className = "size-5" }: LinkLabelTypeIconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={labels[type] ?? "Link Label content"}>
      {type === "article" && <><path {...common} d="M5 3.5h10l4 4V20.5H5z"/><path {...common} d="M15 3.5v4h4M8 11h8M8 14.5h8M8 18h5"/></>}
      {type === "text" && <><rect {...common} x="3.5" y="5" width="17" height="14" rx="2"/><path {...common} d="M7 9h10M7 12h7M7 15h9"/></>}
      {type === "image" && <><rect {...common} x="3.5" y="4" width="17" height="16" rx="2"/><circle {...common} cx="8.2" cy="9" r="1.4"/><path {...common} d="m5.5 17 4.2-4.2 2.8 2.7 2.1-2.1 3.9 3.6"/></>}
      {type === "meme" && <><path {...common} d="M5 5.5h14v13H5zM8 9h.01M16 9h.01"/><path {...common} d="M8.2 14c1.1 1 2.3 1.5 3.8 1.5s2.7-.5 3.8-1.5"/><path {...common} d="M3 8V3h5M21 16v5h-5"/></>}
      {type === "gif" && <><rect {...common} x="2.5" y="5" width="19" height="14" rx="3"/><path {...common} d="M8.5 10.2a2.4 2.4 0 1 0 0 3.6h1.3v-1.7H8.5M12.3 9.8v4.4M15 14.2V9.8h3"/></>}
      {type === "video" && <><rect {...common} x="3" y="5" width="14" height="14" rx="2"/><path {...common} d="m17 10 4-2v8l-4-2zM8.5 9.3l4.5 2.7-4.5 2.7z"/></>}
      {type === "youtube" && <><path {...common} d="M21 12c0 3.2-.4 5.1-1.1 5.8-.8.8-3.4 1.2-7.9 1.2s-7.1-.4-7.9-1.2C3.4 17.1 3 15.2 3 12s.4-5.1 1.1-5.8C4.9 5.4 7.5 5 12 5s7.1.4 7.9 1.2C20.6 6.9 21 8.8 21 12Z"/><path {...common} d="m10 9 5 3-5 3z"/></>}
      {type === "link" && <><path {...common} d="M9.5 14.5 14.5 9M7.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M16.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0"/></>}
      {!labels[type] && <><circle {...common} cx="12" cy="12" r="8.5"/><path {...common} d="M12 8v4M12 16h.01"/></>}
    </svg>
  );
}
