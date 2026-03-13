
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Newsdata.io images
      { protocol: 'https', hostname: 'cdn.newsdata.io' },
      // Common news domains (useful for Mediastack and other general news link-outs)
      { protocol: 'https', hostname: '**.reuters.com' },
      { protocol: 'https', hostname: '**.ft.com' },
      { protocol: 'https', hostname: '**.wsj.com' },
      { protocol: 'https', hostname: 'media.cnn.com' },
      { protocol: 'https', hostname: '**.cnn.com' },
      { protocol: 'https', hostname: '**.nytimes.com' },
      { protocol: 'https', hostname: '**.bbc.co.uk' },
      { protocol: 'https', hostname: '**.bbc.com' },
      { protocol: 'https', hostname: 'news.google.com' },
      { protocol: 'https', hostname: '**.google.com' },
      { protocol: 'https', hostname: 's.yimg.com' },
      { protocol: 'https', hostname: '**.theguardian.com' },
      { protocol: 'https', hostname: '**.apnews.com' },
      { protocol: 'https', hostname: '**.techcrunch.com' },
      { protocol: 'https', hostname: '**.theverge.com' },
      { protocol: 'https', hostname: 'img.etimg.com' },
      { protocol: 'https', hostname: 'images.indianexpress.com' },
      { protocol: 'https', hostname: 'www.aljazeera.com' },
      { protocol: 'https', hostname: 'bloximages.chicago2.vip.townnews.com' },
      { protocol: 'https', hostname: 'afpbb.ismcdn.jp' },
      { protocol: 'https', hostname: 'pxcdn.meridiano.net' },
      { protocol: 'https', hostname: 's-aicmscdn.nhipsongkinhdoanh.vn' },
      { protocol: 'https', hostname: 'vesti.az' },
      { protocol: 'https', hostname: 'keralakaumudi.com' },
      { protocol: 'https', hostname: 'media.losandes.com.ar' },
      { protocol: 'https', hostname: 'cassette.sphdigital.com.sg' },
      { protocol: 'https', hostname: 'bloximages.newyork1.vip.townnews.com' },
    ],
  },
};

export default nextConfig;
