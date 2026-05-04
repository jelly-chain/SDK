import { Player } from '../types.js';

const POSITION_MAP: Record<string, Player['position']> = {
  goalkeeper: 'GK', gk: 'GK', g: 'GK',
  defender: 'DEF', def: 'DEF', d: 'DEF', cb: 'DEF', lb: 'DEF', rb: 'DEF',
  midfielder: 'MID', mid: 'MID', m: 'MID', cm: 'MID', dm: 'MID', am: 'MID',
  forward: 'FWD', fwd: 'FWD', f: 'FWD', cf: 'FWD', lw: 'FWD', rw: 'FWD', st: 'FWD',
  attacker: 'FWD',
};

/** Normalizes player data from any provider into the SDK's Player type. */
export class PlayerNormalizer {
  normalize(raw: Record<string, unknown>, teamId: string): Player {
    const name = String(raw['name'] ?? raw['playerName'] ?? '');
    return {
      id: `player-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      name,
      teamId,
      position: this.normalizePosition(String(raw['position'] ?? 'MID')),
      age: raw['age'] as number | undefined,
      caps: raw['caps'] as number | undefined,
      goals: raw['goals'] as number | undefined,
      available: raw['available'] !== false && raw['injured'] !== true,
      injuryNote: raw['injuryNote'] as string | undefined,
    };
  }

  private normalizePosition(raw: string): Player['position'] {
    return POSITION_MAP[raw.toLowerCase()] ?? 'MID';
  }
}
