export interface EventsConfig {
  eventbriteToken?: string;
  ticketmasterKey?: string;
  enabled?: boolean;
}

export interface EventVenue {
  name: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
}

export interface EventData {
  id: string;
  source: 'eventbrite' | 'ticketmaster' | 'manual';
  name: string;
  description?: string;
  category: string;
  startDate: string;
  endDate?: string;
  venue?: EventVenue;
  url?: string;
  priceRange?: { min: number; max: number; currency: string };
  status: 'on-sale' | 'sold-out' | 'cancelled' | 'postponed' | 'rescheduled';
  attendance?: number;
  popularity?: number;
  tags: string[];
}

export interface EventSearchQuery {
  keyword?: string;
  city?: string;
  country?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  radius?: number; // km
}

export interface EventMarketSignal {
  event: EventData;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reason: string;
  relatedTokens?: string[];
}
