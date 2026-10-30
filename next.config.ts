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
      // Standalone "Ask the 8" magic 8-ball page (static file in public/magic-8-ball/)
      {source:"/magic-8-ball",destination:"/magic-8-ball/index.html"},
      // Standalone "Flip It" coin toss page (static file in public/coin-flip/)
      {source:"/coin-flip",destination:"/coin-flip/index.html"},
      // "Outrunning Portugal — Rota do Sol" arcade road-trip game (static files in public/outrunning-portugal/)
      {source:"/outrunning-portugal",destination:"/outrunning-portugal/index.html"},
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
    {source:"/mockup-templates/:asset*.avif",headers:[
      {key:"Cache-Control",value:"public, max-age=31536000, immutable"},
    ]},
  ]},
};

export default nextConfig;
