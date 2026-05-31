import type { ManifoldMarket, CalibrationData } from './types.js';

export class ManifoldCalibration {
  /** Calculate calibration data from resolved markets */
  calculateCalibration(markets: ManifoldMarket[]): CalibrationData[] {
    const resolved = markets.filter((m) => m.isResolved && m.resolutionProbability !== undefined);
    if (resolved.length < 10) return [];

    const buckets: CalibrationData[] = [];
    for (let i = 0; i < 10; i++) {
      const min = i / 10;
      const max = (i + 1) / 10;
      const bucketMarkets = resolved.filter(
        (m) => m.probability >= min && m.probability < max
      );

      if (bucketMarkets.length > 0) {
        const avgPredicted = bucketMarkets.reduce((s, m) => s + m.probability, 0) / bucketMarkets.length;
        const actualRate = bucketMarkets.filter((m) => m.resolution === 'YES' || m.resolutionProbability! > 0.5).length / bucketMarkets.length;

        buckets.push({
          bucket: i * 10 + 5,
          predicted: Math.round(avgPredicted * 100) / 100,
          actual: Math.round(actualRate * 100) / 100,
          count: bucketMarkets.length,
        });
      }
    }

    return buckets;
  }

  /** Calculate Brier score */
  brierScore(markets: ManifoldMarket[]): number {
    const resolved = markets.filter((m) => m.isResolved);
    if (resolved.length === 0) return 1;

    const sum = resolved.reduce((s, m) => {
      const predicted = m.probability;
      const actual = m.resolution === 'YES' ? 1 : 0;
      return s + Math.pow(predicted - actual, 2);
    }, 0);

    return Math.round((sum / resolved.length) * 1000) / 1000;
  }

  /** Find overconfident predictions (market was too sure) */
  findOverconfident(markets: ManifoldMarket[], threshold: number = 0.8): ManifoldMarket[] {
    return markets.filter((m) => {
      if (!m.isResolved) return false;
      const wasConfident = m.probability > threshold || m.probability < (1 - threshold);
      const wasWrong = (m.probability > 0.5 && m.resolution !== 'YES') || (m.probability < 0.5 && m.resolution !== 'NO');
      return wasConfident && wasWrong;
    });
  }

  /** Compare two prediction sources */
  comparePredictions(
    manifold: number,
    metaculus: number,
    market: number,
  ): {
    consensus: number;
    divergence: number;
    signal: string;
  } {
    const predictions = [manifold, metaculus, market];
    const consensus = predictions.reduce((s, p) => s + p, 0) / predictions.length;
    const maxDiv = Math.max(...predictions.map((p) => Math.abs(p - consensus)));

    let signal = 'Predictions aligned';
    if (maxDiv > 0.15) {
      const outlier = predictions.find((p) => Math.abs(p - consensus) === maxDiv);
      const source = outlier === manifold ? 'Manifold' : outlier === metaculus ? 'Metaculus' : 'Market';
      signal = `${source} is an outlier (${maxDiv > 0 ? '+' : ''}${(maxDiv * 100).toFixed(0)}% from consensus)`;
    }

    return {
      consensus: Math.round(consensus * 1000) / 1000,
      divergence: Math.round(maxDiv * 1000) / 1000,
      signal,
    };
  }
}
