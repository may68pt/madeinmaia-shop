import Image from "next/image";

export function BrandLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return <Image src="/madeinmaia-logo-linklabel-web.png" alt="Made in Maia Link Label" width={200} height={237} priority className={`mim-brand-logo object-contain ${className}`} />;
}
