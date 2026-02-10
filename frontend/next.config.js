/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Polyfill Node.js modules for stable-layer-sdk / @pythnetwork/pyth-sui-js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        process: require.resolve('process/browser'),
      };

      // Inject Buffer globally via webpack ProvidePlugin
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
        // Handle `node:` protocol imports (e.g. `import { Buffer } from "node:buffer"`)
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource) => {
            const mod = resource.request.replace(/^node:/, '');
            switch (mod) {
              case 'buffer':
                resource.request = 'buffer';
                break;
              case 'stream':
                resource.request = 'stream-browserify';
                break;
              case 'crypto':
                resource.request = 'crypto-browserify';
                break;
              case 'process':
                resource.request = 'process/browser';
                break;
              default:
                throw new Error(`No browser polyfill for node:${mod}`);
            }
          }
        )
      );
    }
    return config;
  },
};

module.exports = nextConfig;
