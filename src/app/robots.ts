import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tk77.sk';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Auth-gated pages and one-time-token flows have nothing worth indexing.
      disallow: ['/admin', '/profile', '/orders', '/credit', '/potvrdenie-rezervacie', '/api', '/auth', '/login', '/signup', '/forgot-password', '/reset-password']
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
