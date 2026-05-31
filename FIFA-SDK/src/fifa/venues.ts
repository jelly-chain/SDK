import { Venue } from '../types.js';
import { MemoryCache } from '../cache/memory-cache.js';
import { NotFoundError } from '../errors.js';

/** Provides venue (stadium) data for World Cup matches. */
export class VenuesModule {
  constructor(private readonly cache: MemoryCache) {}

  /** List all tournament venues. */
  async list(): Promise<Venue[]> {
    const cacheKey = 'venues:list';
    const cached = this.cache.get<Venue[]>(cacheKey);
    if (cached) return cached;
    return [];
  }

  /** Fetch a venue by its ID. */
  async byId(venueId: string): Promise<Venue> {
    const cacheKey = `venues:id:${venueId}`;
    const cached = this.cache.get<Venue>(cacheKey);
    if (cached) return cached;

    throw new NotFoundError('Venue', venueId);
  }
}
