import { AbstractProvider } from '../base-provider.js';

export interface NewsProviderConfig {
  enabled?: boolean;
  apiKey?: string;
  baseUrl?: string;
}

export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  tags: string[];
}

/** Client stub for a news/social feed provider for squad updates and match news. */
export class NewsClient extends AbstractProvider {
  readonly name = 'news';
  readonly enabled: boolean;
  private apiKey: string;

  constructor(config: NewsProviderConfig = {}) {
    super();
    this.apiKey = config.apiKey ?? process.env['NEWS_API_KEY'] ?? '';
    this.enabled = (config.enabled ?? false) && this.apiKey.length > 0;
  }

  async fetchByTeam(teamName: string, limit = 5): Promise<NewsArticle[]> {
    this.logRequest(`/news?q=${teamName}&limit=${limit}`);
    return [];
  }

  async fetchInjuryNews(teamName: string): Promise<NewsArticle[]> {
    return this.fetchByTeam(`${teamName} injury`);
  }
}
