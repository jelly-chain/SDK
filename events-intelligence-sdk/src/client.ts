import type { EventsConfig, EventData, EventSearchQuery, EventVenue } from './types.js';

export class EventsClient {
  private readonly eventbriteToken: string;
  private readonly ticketmasterKey: string;
  readonly enabled: boolean;

  constructor(config: EventsConfig = {}) {
    this.eventbriteToken = config.eventbriteToken ?? process.env['EVENTBRITE_TOKEN'] ?? '';
    this.ticketmasterKey = config.ticketmasterKey ?? process.env['TICKETMASTER_KEY'] ?? '';
    this.enabled = config.enabled !== false;
  }

  async searchEventbrite(query: EventSearchQuery): Promise<EventData[]> {
    if (!this.eventbriteToken) return [];
    try {
      const qs = new URLSearchParams();
      if (query.keyword) qs.set('q', query.keyword);
      if (query.city) qs.set('location.address', query.city);
      if (query.category) qs.set('categories', query.category);
      qs.set('expand', 'venue');

      const res = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${qs}`, {
        headers: { 'Authorization': `Bearer ${this.eventbriteToken}` },
      });
      if (!res.ok) return [];
      const data = await res.json() as { events: any[] };
      return data.events.map((e) => this.normalizeEventbrite(e));
    } catch {
      return [];
    }
  }

  async searchTicketmaster(query: EventSearchQuery): Promise<EventData[]> {
    if (!this.ticketmasterKey) return [];
    try {
      const qs = new URLSearchParams({ apikey: this.ticketmasterKey });
      if (query.keyword) qs.set('keyword', query.keyword);
      if (query.city) qs.set('city', query.city);
      if (query.country) qs.set('countryCode', query.country);
      if (query.startDate) qs.set('startDateTime', query.startDate);
      if (query.endDate) qs.set('endDateTime', query.endDate);
      if (query.radius) qs.set('radius', String(query.radius));

      const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${qs}`);
      if (!res.ok) return [];
      const data = await res.json() as { _embedded?: { events: any[] } };
      return (data._embedded?.events ?? []).map((e) => this.normalizeTicketmaster(e));
    } catch {
      return [];
    }
  }

  async search(query: EventSearchQuery): Promise<EventData[]> {
    const [eb, tm] = await Promise.all([
      this.searchEventbrite(query),
      this.searchTicketmaster(query),
    ]);
    return [...eb, ...tm].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  private normalizeEventbrite(e: any): EventData {
    return {
      id: `eb-${e.id}`,
      source: 'eventbrite',
      name: e.name?.text ?? '',
      description: e.description?.text?.slice(0, 500),
      category: e.category_id ?? 'unknown',
      startDate: e.start?.utc ?? '',
      endDate: e.end?.utc,
      venue: e.venue ? {
        name: e.venue.name ?? '',
        city: e.venue.address?.city ?? '',
        country: e.venue.address?.country ?? '',
        latitude: parseFloat(e.venue.address?.latitude ?? '0'),
        longitude: parseFloat(e.venue.address?.longitude ?? '0'),
      } : undefined,
      url: e.url,
      status: e.status === 'live' ? 'on-sale' : e.status === 'completed' ? 'sold-out' : 'on-sale',
      popularity: e.capacity,
      tags: [],
    };
  }

  private normalizeTicketmaster(e: any): EventData {
    const venue = e._embedded?.venues?.[0];
    return {
      id: `tm-${e.id}`,
      source: 'ticketmaster',
      name: e.name ?? '',
      description: e.info?.slice(0, 500),
      category: e.classifications?.[0]?.segment?.name ?? 'unknown',
      startDate: e.dates?.start?.dateTime ?? '',
      endDate: e.dates?.end?.dateTime,
      venue: venue ? {
        name: venue.name ?? '',
        city: venue.city?.name ?? '',
        country: venue.country?.countryCode ?? '',
        latitude: parseFloat(venue.location?.latitude ?? '0'),
        longitude: parseFloat(venue.location?.longitude ?? '0'),
        capacity: venue.capacity,
      } : undefined,
      url: e.url,
      priceRange: e.priceRanges?.[0] ? {
        min: e.priceRanges[0].min,
        max: e.priceRanges[0].max,
        currency: e.priceRanges[0].currency,
      } : undefined,
      status: e.dates?.status?.code === 'onsale' ? 'on-sale' : e.dates?.status?.code === 'cancelled' ? 'cancelled' : 'on-sale',
      tags: e.classifications?.map((c: any) => c.genre?.name).filter(Boolean) ?? [],
    };
  }
}
