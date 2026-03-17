/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@node-rs/argon2", "csv"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value:
              "noindex, nofollow, noarchive, nosnippet, noimageindex, nocache, max-image-preview:none, max-snippet:-1, max-video-preview:-1",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
