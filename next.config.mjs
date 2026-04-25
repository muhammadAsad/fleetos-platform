/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["leaflet", "react-leaflet"],
  eslint: {
    // Warnings don't block production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Simulator files are local dev tools, not part of the app
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
