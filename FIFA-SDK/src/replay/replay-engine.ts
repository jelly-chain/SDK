import { MatchEvent } from '../types.js';

export interface ReplayFrame {
  timestamp: string;
  minuteInMatch: number;
  events: MatchEvent[];
  homeScore: number;
  awayScore: number;
  snapshot: Record<string, unknown>;
}

/** Replays a match or tournament stage event by event for debugging and analysis. */
export class ReplayEngine {
  private frames: ReplayFrame[] = [];

  /** Load a sequence of events for replay. */
  load(events: MatchEvent[], kickoffUtc: string): void {
    this.frames = [];
    let homeScore = 0;
    let awayScore = 0;

    const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);
    for (const event of sortedEvents) {
      if (event.type === 'goal') homeScore++;
      if (event.type === 'own_goal') awayScore++;

      this.frames.push({
        timestamp: kickoffUtc,
        minuteInMatch: event.minute,
        events: [event],
        homeScore,
        awayScore,
        snapshot: { homeScore, awayScore },
      });
    }
  }

  /** Get all replay frames. */
  getFrames(): ReplayFrame[] {
    return [...this.frames];
  }

  /** Get the frame at a specific match minute. */
  atMinute(minute: number): ReplayFrame | undefined {
    return [...this.frames].reverse().find(f => f.minuteInMatch <= minute);
  }
}
