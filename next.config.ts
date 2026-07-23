import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const postSlugs = [
      'juggle-walking',
      'software-artist-1982-vs-today',
      'software-artists',
      'darworms-launch-announcement',
      'artist-tribute-jim-nitchals',
      'chaotic-attractor',
      'the-joy-of-coding-observable',
      'storiadelpcgaming',
      'rust-wasm-attractor',
      'extending-covid-dashboard',
      'keyset',
      'rolling-polygons-mandalas',
      'colorful-pascal-mandalas',
      'pickover-attractor',
      'rust-audio-visualizer',
      'cyclic-demons',
    ];

    const slugRedirects = postSlugs.flatMap((slug) => [
      {
        source: `/${slug}`,
        destination: `/blog/${slug}`,
        permanent: true,
      },
      {
        source: `/${slug}/`,
        destination: `/blog/${slug}`,
        permanent: true,
      },
    ]);

    return [
      ...slugRedirects,
      {
        source: '/tutorials',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/projects',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/portfolio',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/thoughts',
        destination: '/blog',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
