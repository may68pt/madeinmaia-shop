import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects(){return [
    {source:"/produto/:slug",destination:"/designs/:slug",permanent:true},
    {source:"/colecao/:tag",destination:"/collections/:tag",permanent:true},
    {source:"/colecoes",destination:"/collections",permanent:true},
  ]},
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
