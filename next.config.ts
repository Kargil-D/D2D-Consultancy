import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    devtoolSegmentExplorer: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      // Our own Vercel Blob store — every admin upload (ImageUpload → /api/admin/upload) lands here.
      // Without it, next/image's optimizer rejects these URLs (HTTP 400) and the image renders broken.
      // Deliberately this one store, not *.public.blob.vercel-storage.com, so the optimizer can't be
      // used to resize other people's images on our quota.
      { protocol: "https", hostname: "qlj545rwitp0ocb6.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
