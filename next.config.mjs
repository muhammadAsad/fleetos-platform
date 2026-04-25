/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["mapbox-gl"],
  webpack: (config) => {
    // Allow mapbox-gl worker to be bundled properly
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
