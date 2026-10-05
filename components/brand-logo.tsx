import Image from "next/image";

export function BrandLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return <Image src="/made-in-maia-logo-white.svg" alt="Made in Maia" width={333} height={65} priority className={`mim-brand-logo object-contain ${className}`} />;
}
