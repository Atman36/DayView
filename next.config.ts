import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Hide the dev "N" indicator button in development
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: false, // Включаем проверку ошибок TypeScript для production
  },
  eslint: {
    // Allow builds to succeed even if there are lint warnings/errors.
    // We still run lint in CI/dev, but do not block production builds.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
