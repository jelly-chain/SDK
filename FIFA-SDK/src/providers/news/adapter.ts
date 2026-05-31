import { NewsArticle } from './client.js';

/** Adapts raw news API responses to normalized NewsArticle objects. */
export class NewsAdapter {
  normalize(raw: Record<string, unknown>): NewsArticle {
    return {
      title: String(raw['title'] ?? ''),
      summary: String(raw['description'] ?? raw['content'] ?? ''),
      url: String(raw['url'] ?? ''),
      publishedAt: String(raw['publishedAt'] ?? new Date().toISOString()),
      source: String((raw['source'] as Record<string, unknown>)?.['name'] ?? 'unknown'),
      tags: [],
    };
  }
}
