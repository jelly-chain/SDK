import { MatchEvent } from '../types.js';

export interface ReconstructedState {
  minute: number;
  homeScore: number;
  awayScore: number;
  homeRedCards: number;
  awayRedCards: number;
  homeTeamId: string;
  awayTeamId: string;
}

/** Reconstructs full match state at any given minute from event data. */
export class EventReconstructor {
  reconstruct(
    events: MatchEvent[],
    upToMinute: number,
    homeTeamId: string,
    awayTeamId: string,
  ): ReconstructedState {
    const relevant = events.filter(e => e.minute <= upToMinute);
    let homeScore = 0;
    let awayScore = 0;
    let homeRedCards = 0;
    let awayRedCards = 0;

    for (const e of relevant) {
      const isHome = e.teamId === homeTeamId;
      if (e.type === 'goal') isHome ? homeScore++ : awayScore++;
      if (e.type === 'own_goal') isHome ? awayScore++ : homeScore++;
      if (e.type === 'red_card') isHome ? homeRedCards++ : awayRedCards++;
    }

    return { minute: upToMinute, homeScore, awayScore, homeRedCards, awayRedCards, homeTeamId, awayTeamId };
  }
}
