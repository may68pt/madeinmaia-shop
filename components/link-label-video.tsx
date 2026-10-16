"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function LinkLabelVideo({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = 1;
    video.muted = false;
    void video.play().catch(() => {
      video.muted = true;
      setMuted(true);
      void video.play();
    });
  }, [src]);

  function enableSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    setMuted(false);
    void video.play();
    trackEvent("linklabel_action",{entityType:"linklabel",entityId:title,metadata:{action:"video_sound"}});
  }

  return (
    <div className="absolute inset-0 bg-black">
      <video ref={videoRef} aria-label={title} className="h-full w-full object-contain" controls playsInline autoPlay loop preload="auto" src={src} />
      {muted&&<button type="button" onClick={enableSound} className="absolute bottom-24 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black uppercase text-black shadow-2xl sm:bottom-6 sm:left-6"><Volume2 className="size-4"/>Ativar som</button>}
    </div>
  );
}

export function LinkLabelYoutube({ src, title }: { src: string; title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [soundRequested, setSoundRequested] = useState(false);

  function enableSound() {
    const player = frameRef.current?.contentWindow;
    player?.postMessage(JSON.stringify({ event:"command", func:"unMute", args:[] }), "https://www.youtube-nocookie.com");
    player?.postMessage(JSON.stringify({ event:"command", func:"setVolume", args:[100] }), "https://www.youtube-nocookie.com");
    player?.postMessage(JSON.stringify({ event:"command", func:"playVideo", args:[] }), "https://www.youtube-nocookie.com");
    setSoundRequested(true);
    trackEvent("linklabel_action",{entityType:"linklabel",entityId:title,metadata:{action:"youtube_sound"}});
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-black">
      <iframe ref={frameRef} className="aspect-video h-auto max-h-dvh w-full" src={`${src}?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      <button type="button" onClick={enableSound} className="absolute bottom-24 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black uppercase text-black shadow-2xl sm:bottom-6 sm:left-6">{soundRequested?<Volume2 className="size-4"/>:<VolumeX className="size-4"/>}{soundRequested?"Som ativo":"Ativar som"}</button>
    </div>
  );
}
