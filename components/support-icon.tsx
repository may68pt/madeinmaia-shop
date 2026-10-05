import Image from "next/image";

const SUPPORT_ICONS:Record<string,string> = {
  "tshirt-150":"/icons/support-tshirt.png",
  "tshirt-190":"/icons/support-tshirt.png",
  hoodie:"/icons/support-hoodie.png",
  "long-sleeve":"/icons/support-long-sleeve.png",
  "tote-bag":"/icons/support-tote.png",
};

export function SupportIcon({ supportId, size=24 }: { supportId:string; size?:number }) {
  const src=SUPPORT_ICONS[supportId] ?? SUPPORT_ICONS["tshirt-150"];
  return <Image src={src} alt="" width={size} height={size} className="mix-blend-multiply object-contain" aria-hidden="true" />;
}
