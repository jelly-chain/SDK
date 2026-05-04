import { Fixture, GroupStanding } from '../types.js';

export interface HistoricalSnapshot {
  year: number;
  fixtures: Fixture[];
  standings: Record<string, GroupStanding[]>;
  topScorer?: { name: string; goals: number };
  winner: string;
}

/** Loads historical World Cup data for backtesting scenarios. */
export class HistoricalLoader {
  private snapshots = new Map<number, HistoricalSnapshot>();

  /** Load a historical World Cup snapshot by year. */
  load(year: number): HistoricalSnapshot | null {
    return this.snapshots.get(year) ?? null;
  }

  /** Register a historical snapshot (e.g. loaded from a JSON fixture file). */
  register(snapshot: HistoricalSnapshot): void {
    this.snapshots.set(snapshot.year, snapshot);
  }

  /** Return all available years. */
  availableYears(): number[] {
    return Array.from(this.snapshots.keys()).sort();
  }
}
