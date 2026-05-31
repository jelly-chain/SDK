import { MatchEvent, Fixture } from '../types.js';

export interface TimelineEntry {
  minute: number;
  type: MatchEvent['type'];
  teamId: string;
  playerId?: string;
  description: string;
}

/** Builds a human-readable timeline from match events. */
export class TimelineBuilder {
  build(fixture: Fixture, events: MatchEvent[]): TimelineEntry[] {
    const sorted = [...events].sort((a, b) => a.minute - b.minute);

    return sorted.map(event => ({
      minute: event.minute,
      type: event.type,
      teamId: event.teamId,
      playerId: event.playerId,
      description: this.describe(event, fixture),
    }));
  }

  private describe(event: MatchEvent, fixture: Fixture): string {
    const team = event.teamId === fixture.homeTeamId ? 'Home' : 'Away';
    switch (event.type) {
      case 'goal': return `${team} goal at ${event.minute}'`;
      case 'own_goal': return `Own goal at ${event.minute}'`;
      case 'yellow_card': return `Yellow card (${team}) at ${event.minute}'`;
      case 'red_card': return `Red card (${team}) at ${event.minute}'`;
      case 'substitution': return `Substitution (${team}) at ${event.minute}'`;
      case 'penalty': return `Penalty (${team}) at ${event.minute}'`;
      default: return `Event at ${event.minute}'`;
    }
  }
}
