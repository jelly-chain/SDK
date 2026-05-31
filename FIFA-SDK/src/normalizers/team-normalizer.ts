import { Team } from '../types.js';

/** Normalizes team data from any provider into the SDK's Team type. */
export class TeamNormalizer {
  normalize(raw: Record<string, unknown>): Team {
    const name = String(raw['name'] ?? raw['teamName'] ?? '');
    return {
      id: this.buildTeamId(name, raw),
      name,
      shortName: String(raw['shortName'] ?? raw['code'] ?? raw['abbreviation'] ?? name.slice(0, 3).toUpperCase()),
      countryCode: String(raw['countryCode'] ?? raw['country'] ?? ''),
      fifaRanking: raw['fifaRanking'] as number | undefined,
      confederation: raw['confederation'] as string | undefined,
    };
  }

  private buildTeamId(name: string, raw: Record<string, unknown>): string {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `team-${slug}`;
  }
}
