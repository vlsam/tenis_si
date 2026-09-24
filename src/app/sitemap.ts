import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tk77.sk';

  // Only the public marketing/browsing pages - everything auth-gated or
  // one-time-token-based (see robots.ts) has no reason to be indexed.
  const routes = ['', '/o-klube', '/cennik', '/kontakt', '/courts'];

  return routes.map(route => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/courts' ? 'hourly' : 'monthly',
    priority: route === '' ? 1 : 0.7
  }));
}
