/**
 * EventIntelligence — event-driven market intelligence from Eventbrite, Ticketmaster, conference tracking
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import type { EventData, EventSearchQuery, EventSearchResult, EventMarketSignal, ConferenceIntelligence, EventType, EventSource } from "./types.js";

export interface EventIntelligenceConfig extends BaseSDKConfig {
  eventbriteApiKey?: string;
  ticketmasterApiKey?: string;
  defaultLimit?: number;
}

export class EventIntelligence extends BaseSDK {
  private readonly ebKey?: string;
  private readonly tmKey?: string;
  private readonly defaultLimit: number;

  constructor(config: EventIntelligenceConfig) {
    super(config, "EventIntelligence");
    this.ebKey = config.eventbriteApiKey;
    this.tmKey = config.ticketmasterApiKey;
    this.defaultLimit = config.defaultLimit || 50;
  }

  async searchEvents(query: EventSearchQuery): Promise<EventSearchResult> {
    const results: EventData[] = [];
    if (this.ebKey) {
      const ebResults = await this.searchEventbrite(query).catch(() => [] as EventData[]);
      results.push(...ebResults);
    }
    if (this.tmKey) {
      const tmResults = await this.searchTicketmaster(query).catch(() => [] as EventData[]);
      results.push(...tmResults);
    }
    if (!this.ebKey && !this.tmKey) {
      results.push(...this.generateSampleEvents(query));
    }
    return { events: results, totalResults: results.length, page: 1, hasMore: false, fetchedAt: Date.now() };
  }

  async getEvent(eventId: string, source: EventSource = EventSource.EVENTBRITE): Promise<EventData | null> {
    if (source === EventSource.EVENTBRITE && this.ebKey) {
      return this.request<EventData>(`https://www.eventbriteapi.com/v3/events/${eventId}/`, { headers: { Authorization: `Bearer ${this.ebKey}` } }).catch(() => null);
    }
    return null;
  }

  async generateSignals(event: EventData): Promise<EventMarketSignal[]> {
    const signals: EventMarketSignal[] = [];
    const cryptoKeywords = ["crypto", "bitcoin", "ethereum", "blockchain", "web3", "defi", "nft", "dao", "token", "ai", "artificial intelligence"];
    const isRelevant = event.tags.some(t => cryptoKeywords.some(k => t.toLowerCase().includes(k))) || cryptoKeywords.some(k => event.name.toLowerCase().includes(k) || event.description.toLowerCase().includes(k));
    if (isRelevant) {
      signals.push({ event, signal: "bullish", confidence: 0.6, reasoning: `Crypto-related event: ${event.name}`, affectedTokens: ["ETH", "BTC"], affectedSectors: ["crypto", "ai"], expectedImpact: 0.5, timestamp: Date.now() });
    }
    if (event.type === EventType.CONFERENCE && event.capacity && event.capacity > 5000) {
      signals.push({ event, signal: "bullish", confidence: 0.5, reasoning: `Major conference with ${event.capacity}+ attendees`, affectedTokens: ["ETH"], affectedSectors: ["infrastructure"], expectedImpact: 0.3, timestamp: Date.now() });
    }
    return signals;
  }

  async analyzeConference(name: string): Promise<ConferenceIntelligence> {
    const search = await this.searchEvents({ keywords: name, type: EventType.CONFERENCE, limit: 1 });
    const event = search.events[0];
    if (!event) throw new Error(`Conference not found: ${name}`);
    const signals = await this.generateSignals(event);
    return { name: event.name, startDate: event.startDate, endDate: event.endDate, city: event.city, expectedAttendees: event.capacity || 0, speakers: [], sponsors: [], relatedTokens: [...new Set(signals.flatMap(s => s.affectedTokens))], sentiment: signals.reduce((s, sig) => s + sig.confidence * (sig.signal === "bullish" ? 1 : -1), 0) / Math.max(1, signals.length), keyTopics: event.tags, predictionSignals: signals };
  }

  async trackEvent(eventId: string, callback: (event: EventData) => void, intervalMs = 300_000): Promise<() => void> {
    const interval = setInterval(async () => {
      try { const event = await this.getEvent(eventId); if (event) callback(event); } catch { /* ignore */ }
    }, intervalMs);
    return () => clearInterval(interval);
  }

  async getTrendingEvents(city?: string, daysAhead = 30): Promise<EventData[]> {
    const now = Date.now();
    const results = await this.searchEvents({ city, startDate: now, endDate: now + daysAhead * 86400000, limit: this.defaultLimit });
    return results.events.sort((a, b) => (b.attendees || 0) - (a.attendees || 0));
  }

  private async searchEventbrite(query: EventSearchQuery): Promise<EventData[]> {
    if (!this.ebKey) return [];
    const params = new URLSearchParams();
    if (query.keywords) params.set("q", query.keywords);
    if (query.city) params.set("location.address", query.city);
    params.set("start_date.range_start", new Date(query.startDate || Date.now()).toISOString());
    params.set("start_date.range_end", new Date(query.endDate || Date.now() + 30 * 86400000).toISOString());
    params.set("page_size", String(query.limit || this.defaultLimit));
    const data = await this.request<{ events: Record<string, unknown>[]; pagination: Record<string, number> }>(`https://www.eventbriteapi.com/v3/events/search/?${params}`, { headers: { Authorization: `Bearer ${this.ebKey}` } });
    return (data.events || []).map(e => this.parseEventbriteEvent(e));
  }

  private async searchTicketmaster(query: EventSearchQuery): Promise<EventData[]> {
    if (!this.tmKey) return [];
    const params = new URLSearchParams({ apikey: this.tmKey, size: String(query.limit || this.defaultLimit) });
    if (query.keywords) params.set("keyword", query.keywords);
    if (query.city) params.set("city", query.city);
    const data = await this.request<{ _embedded: { events: Record<string, unknown>[] } }>(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    return (data._embedded?.events || []).map(e => this.parseTicketmasterEvent(e));
  }

  private parseEventbriteEvent(raw: Record<string, unknown>): EventData {
    const start = raw.start as Record<string, string>;
    const end = raw.end as Record<string, string>;
    const venue = raw.venue as Record<string, unknown> || {};
    return { id: raw.id as string, name: (raw.name as Record<string, string>)?.text || "", description: (raw.description as Record<string, string>)?.text || "", type: EventType.CONFERENCE, source: EventSource.EVENTBRITE, startDate: new Date(start?.utc || start?.local || Date.now()).getTime(), endDate: new Date(end?.utc || end?.local || Date.now()).getTime(), venue: (venue.name as string) || "", city: (venue.address as Record<string, string>)?.city || "", country: (venue.address as Record<string, string>)?.country || "", capacity: (raw.capacity as number) || null, ticketsAvailable: ((raw.quantity_total as number) || 0) - ((raw.quantity_sold as number) || 0), priceMin: null, priceMax: null, currency: (raw.currency as string) || "USD", url: (raw.url as string) || "", imageUrl: (raw.logo as Record<string, string>)?.url || "", tags: (raw.category as Record<string, string>)?.name ? [(raw.category as Record<string, string>).name!] : [], attendees: (raw.quantity_sold as number) || null, organizer: (raw.organizer as Record<string, string>)?.name || "", createdAt: new Date(raw.created as string || Date.now()).getTime(), updatedAt: new Date(raw.changed as string || Date.now()).getTime(), metadata: raw };
  }

  private parseTicketmasterEvent(raw: Record<string, unknown>): EventData {
    const dates = raw.dates as Record<string, string> || {};
    const venue = ((raw._embedded as Record<string, unknown>)?.venues as Record<string, unknown>[])?.[0] || {};
    const price = (raw.priceRanges as Record<string, number>[])?.[0] || {};
    return { id: raw.id as string, name: raw.name as string, description: "", type: EventType.CONCERT, source: EventSource.TICKETMASTER, startDate: new Date(dates.start?.dateTime || dates.start?.localDate || Date.now()).getTime(), endDate: new Date(dates.end?.dateTime || dates.start?.localDate || Date.now()).getTime(), venue: (venue.name as string) || "", city: (venue.city as Record<string, string>)?.name || "", country: (venue.country as Record<string, string>)?.name || "", capacity: (venue.capacity as number) || null, ticketsAvailable: null, priceMin: price.min || null, priceMax: price.max || null, currency: price.currency || "USD", url: (raw.url as string) || "", imageUrl: ((raw.images as Record<string, string>[])?.[0]?.url) || "", tags: (raw.classifications as Record<string, Record<string, string>>[])?.[0]?.segment?.name ? [(raw.classifications as Record<string, Record<string, string>>[])[0]!.segment!.name!] : [], attendees: null, organizer: "", createdAt: Date.now(), updatedAt: Date.now(), metadata: raw };
  }

  private generateSampleEvents(query: EventSearchQuery): EventData[] {
    const keywords = query.keywords || "";
    const events: EventData[] = [];
    const conferences = ["Consensus 2026", "Devcon", "Token2049", "EthCC", "Sol Breakpoint", "AI Summit", "Web3 Summit"];
    for (let i = 0; i < 3; i++) {
      events.push({ id: `sample-${i}`, name: conferences[i % conferences.length] || `Event ${i}`, description: `Sample event matching "${keywords}"`, type: EventType.CONFERENCE, source: EventSource.CUSTOM, startDate: Date.now() + (i + 1) * 7 * 86400000, endDate: Date.now() + (i + 1) * 7 * 86400000 + 86400000, venue: "Convention Center", city: query.city || "San Francisco", country: "US", capacity: 5000 + i * 1000, ticketsAvailable: 1000, priceMin: 299, priceMax: 999, currency: "USD", url: "", imageUrl: "", tags: ["crypto", "blockchain"], attendees: 3000 + i * 500, organizer: "Sample Org", createdAt: Date.now(), updatedAt: Date.now(), metadata: {} });
    }
    return events;
  }
}
