import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const pageSchema = z.object({
  title: z.string(),
  description: z.string().max(155),
  slug: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  service: z.string().optional(),
  canonical: z.string().url(),
  lastmod: z.string(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  relatedServices: z.array(z.object({ title: z.string(), href: z.string() })).optional(),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: pageSchema,
});

const cities = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/cities' }),
  schema: pageSchema,
});

export const collections = { pages, cities };
