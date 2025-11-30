/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Mengizinkan puppeteer dijalankan di server components
    serverComponentsExternalPackages: ['puppeteer'],
  },
};

// GUNAKAN INI (export default) BUKAN module.exports
export default nextConfig;