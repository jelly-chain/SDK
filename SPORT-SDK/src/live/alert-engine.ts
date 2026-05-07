import { clamp } from '../utils/math.js';

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

export type AlertType =
  | 'odds_spike'
  | 'score_change'
  | 'team_form_shift'
  | 'generic';

export interface AlertEvent {
  type: AlertType;
  matchId?: string;
  timestamp: string;
  severity: 'info' | 'warn' | 'critical';
  message: string;
  meta?: Record<string, unknown>;
}

export interface OddsSpikeInput {
  matchId?: string;
  oddsBefore: number;
  oddsAfter: number;
  /** Minimum relative spike to trigger. Default 0.1 (10%). */
  threshold?: number;
  /** Optional absolute odds delta override. */
  absoluteThreshold?: number;
  timestamp?: string;
}

export interface ScoreChangeInput {
  matchId?: string;
  homeScoreBefore: number;
  awayScoreBefore: number;
  homeScoreAfter: number;
  awayScoreAfter: number;
  /** Minimum goal delta to trigger. Default 1. */
  threshold?: number;
  timestamp?: string;
}

function severityFromMagnitude(mag: number): AlertEvent['severity'] {
  if (mag >= 0.25) return 'critical';
  if (mag >= 0.1) return 'warn';
  return 'info';
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Threshold-based alert triggers for live events. */
export class AlertEngine {
  /**
   * Detect odds spike given before/after odds.
   * Expects odds as decimal odds.
   */
  detectOddsSpike(input: OddsSpikeInput): AlertEvent[] {
    const {
      matchId,
      oddsBefore,
      oddsAfter,
      threshold = 0.1,
      absoluteThreshold,
      timestamp = nowIso(),
    } = input;

    if (!Number.isFinite(oddsBefore) || !Number.isFinite(oddsAfter) || oddsBefore <= 1 || oddsAfter <= 1) {
      throw new Error('detectOddsSpike: oddsBefore/oddsAfter must be valid decimal odds (> 1)');
    }

    // Relative change: (after - before) / before
    const rel = (oddsAfter - oddsBefore) / oddsBefore;
    const abs = Math.abs(oddsAfter - oddsBefore);
    const mag = Math.abs(rel);

    const meetsRelative = Math.abs(rel) >= threshold;
    const meetsAbsolute = absoluteThreshold !== undefined ? abs >= absoluteThreshold : true;

    if (!meetsRelative || !meetsAbsolute) return [];

    const sev = severityFromMagnitude(mag);
    const dir = rel > 0 ? 'up' : 'down';

    const magnitudeScore = clamp01(mag / 0.5);

    return [
      {
        type: 'odds_spike',
        matchId,
        timestamp,
        severity: sev,
        message: `Odds spike detected: odds ${dir} by ${(mag * 100).toFixed(1)}%`,
        meta: {
          oddsBefore,
          oddsAfter,
          relativeChange: rel,
          magnitudeScore,
        },
      },
    ];
  }

  /** Detect score change between two snapshots. */
  detectScoreChange(input: ScoreChangeInput): AlertEvent[] {
    const {
      matchId,
      homeScoreBefore,
      awayScoreBefore,
      homeScoreAfter,
      awayScoreAfter,
      threshold = 1,
      timestamp = nowIso(),
    } = input;

    const homeDelta = homeScoreAfter - homeScoreBefore;
    const awayDelta = awayScoreAfter - awayScoreBefore;
    const totalDelta = Math.abs(homeDelta) + Math.abs(awayDelta);

    if (!Number.isFinite(totalDelta) || totalDelta < threshold) return [];

    const sev = severityFromMagnitude(Math.min(1, totalDelta / 5));

    return [
      {
        type: 'score_change',
        matchId,
        timestamp,
        severity: sev,
        message: `Score changed: Δhome=${homeDelta}, Δaway=${awayDelta}`,
        meta: {
          homeScoreBefore,
          awayScoreBefore,
          homeScoreAfter,
          awayScoreAfter,
          homeDelta,
          awayDelta,
        },
      },
    ];
  }
}
