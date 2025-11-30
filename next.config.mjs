/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ganti librarynya jadi yang versi -min
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  },
};

export default nextConfig;