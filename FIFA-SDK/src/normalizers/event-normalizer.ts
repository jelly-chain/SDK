import { MatchEvent } from '../types.js';

const EVENT_TYPE_MAP: Record<string, MatchEvent['type']> = {
  goal: 'goal', score: 'goal',
  'own goal': 'own_goal', og: 'own_goal',
  'yellow card': 'yellow_card', yellow: 'yellow_card', yc: 'yellow_card',
  'red card': 'red_card', red: 'red_card', rc: 'red_card',
  substitution: 'substitution', sub: 'substitution', subst: 'substitution',
  penalty: 'penalty', pen: 'penalty',
};

/** Normalizes match event data from any provider. */
export class EventNormalizer {
  normalize(raw: Record<string, unknown>, fixtureId: string): MatchEvent {
    return {
      id: String(raw['id'] ?? `${fixtureId}-${raw['minute']}-${raw['type']}`),
      fixtureId,
      type: this.normalizeType(String(raw['type'] ?? raw['detail'] ?? 'goal')),
      minute: Number(raw['minute'] ?? raw['time'] ?? 0),
      teamId: String(raw['teamId'] ?? raw['team'] ?? ''),
      playerId: raw['playerId'] as string | undefined,
      assistPlayerId: raw['assistPlayerId'] as string | undefined,
    };
  }

  private normalizeType(raw: string): MatchEvent['type'] {
    return EVENT_TYPE_MAP[raw.toLowerCase()] ?? 'goal';
  }
}
