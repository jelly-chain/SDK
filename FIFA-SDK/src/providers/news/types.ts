/** Raw response types for the news provider. */

export interface RawNewsArticle {
  title: string;
  description?: string;
  content?: string;
  url: string;
  publishedAt: string;
  source?: { name?: string };
}

export interface RawNewsResponse {
  status: string;
  totalResults: number;
  articles: RawNewsArticle[];
}
