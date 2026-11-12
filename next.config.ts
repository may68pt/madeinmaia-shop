import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects(){return [
    {source:"/produto/:slug",destination:"/designs/:slug",permanent:true},
    {source:"/colecao/:tag",destination:"/collections/:tag",permanent:true},
    {source:"/colecoes",destination:"/collections",permanent:true},
    {source:"/rota-do-sol",destination:"/outrunning-portugal",permanent:true},
  ]},
  async rewrites(){return {
    beforeFiles:[
      {source:"/snake",destination:"/snake-nokia-5510/index.html"},
      {source:"/snake-nokia-5510",destination:"/snake-nokia-5510/index.html"},
      {source:"/oracle",destination:"/oracle/index.html"},
      {source:"/oracle/magic-8-ball-machine",destination:"/oracle/results-may-vary/index.html"},
      {source:"/oracle/:edition(no-signal-from-fate|results-may-vary|ask-again-later|fate-is-calling|the-future-is-classified|the-bones-have-spoken|the-goose-knows)",destination:"/oracle/:edition/index.html"},
      // Standalone "Ask the 8" magic 8-ball page (static file in public/magic-8-ball/)
      {source:"/magic-8-ball",destination:"/magic-8-ball/index.html"},
      {source:"/magic-8-ball-classic",destination:"/magic-8-ball-classic/index.html"},
      // Standalone "Flip It" coin toss page (static file in public/coin-flip/)
      {source:"/coin-flip",destination:"/coin-flip/index.html"},
      // "Outrunning Portugal — Rota do Sol" arcade road-trip game (static files in public/outrunning-portugal/)
      {source:"/outrunning-portugal",destination:"/outrunning-portugal/index.html"},
      // "FÆLIX" bio-tech virtual pet (static files in public/petz/)
      {source:"/petz",destination:"/petz/index.html"},
      // "Bad Samaritan: O Pulso do Porto" 16-bit platformer (static files in public/badsamaritan/)
      {source:"/badsamaritan",destination:"/badsamaritan/index.html"},
      // its service worker (offline play + install); served from the site root so its scope can be /badsamaritan
      {source:"/badsamaritan-sw.js",destination:"/badsamaritan/sw.js"},
    ],
    afterFiles:[],
    fallback:[],
  }},
  async headers(){return [
    {source:"/:path*",headers:[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
    ]},
    {source:"/badsamaritan-sw.js",headers:[
      {key:"Cache-Control",value:"no-cache"},
      {key:"Content-Type",value:"application/javascript; charset=utf-8"},
    ]},
    {source:"/mockup-templates/:asset*.avif",headers:[
      {key:"Cache-Control",value:"public, max-age=31536000, immutable"},
    ]},
  ]},
};

export default nextConfig;
