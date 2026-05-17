/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Strip the "node:" protocol so webpack can apply normal fallbacks
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        stream: false,
        crypto: false,
        buffer: false,
        zlib: false,
        http: false,
        https: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};
module.exports = nextConfig;
