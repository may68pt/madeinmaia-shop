export function SupportIcon({ supportId, size=24 }: { supportId:string; size?:number }) {
  const kind = supportId.startsWith("tshirt-") ? "tshirt" : supportId;
  return <svg viewBox="0 0 100 100" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" className="mim-support-icon block shrink-0">
    {kind === "hoodie" ? <path d="M50 7c-13 0-25 16-30 29-2 5 1 10 7 16l8 8v32H8V57c0-13 10-23 24-25 6 8 12 13 18 18 6-5 12-10 18-18 14 2 24 12 24 25v35H65V60l8-8c6-6 9-11 7-16C75 23 63 7 50 7Zm0 13c8 0 13 7 13 15 0 8-5 14-13 14s-13-6-13-14c0-8 5-15 13-15Z" />
      : kind === "long-sleeve" ? <path d="m27 13-17 9L3 88h17l7-43v47h46V45l7 43h17l-7-66-17-9c-2 11-9 16-23 16S29 24 27 13Z" />
      : kind === "tote-bag" ? <path fillRule="evenodd" d="M25 33h12v-8c0-12 5-19 13-19s13 7 13 19v8h12v61H25V33Zm20 0h10v-8c0-8-2-11-5-11s-5 3-5 11v8Z" />
      : <path d="m29 13-23 21 13 16 10-8v50h42V42l10 8 13-16-23-21c-3 11-9 16-21 16S32 24 29 13Z" />}
  </svg>;
}
