import type {NextConfig} from "next";

const securityHeaders=[
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"X-Frame-Options",value:"DENY"},
 {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
 {key:"Content-Security-Policy",value:"default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; connect-src 'self' https:; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com; font-src 'self' data: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"},
 ...(process.env.NODE_ENV==="production"?[{key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"}]:[])
];

const nextConfig:NextConfig={
 async headers(){return [{source:"/(.*)",headers:securityHeaders}];}
};
export default nextConfig;
