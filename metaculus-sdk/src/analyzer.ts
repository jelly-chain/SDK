import type { MetaculusForecast, MetaculusQuestion, MetaculusCommunityPrediction } from './types.js';

export class MetaculusAnalyzer {
  /** Analyze a forecast */
  analyze(question: MetaculusQuestion, community: MetaculusCommunityPrediction): MetaculusForecast {
    return {
      question,
      community,
      resolved: question.status === 'resolved',
    };
  }

  /** Check if community prediction is well-calibrated */
  assessCalibration(forecasts: MetaculusForecast[]): {
    calibration: number; // 0-1, 1 = perfectly calibrated
    overconfidence: number;
    underconfidence: number;
    sampleSize: number;
  } {
    const resolved = forecasts.filter((f) => f.resolved && f.resolution !== undefined);
    if (resolved.length < 10) {
      return { calibration: 0, overconfidence: 0, underconfidence: 0, sampleSize: resolved.length };
    }

    // Group by prediction bucket
    const buckets: Array<{ predicted: number; actual: number; count: number }> = [];
    for (let i = 0; i < 10; i++) {
      const bucketMin = i / 10;
      const bucketMax = (i + 1) / 10;
      const bucketForecasts = resolved.filter(
        (f) => f.community.community_prediction >= bucketMin && f.community.community_prediction < bucketMax
      );

      if (bucketForecasts.length > 0) {
        const avgPredicted = bucketForecasts.reduce((s, f) => s + f.community.community_prediction, 0) / bucketForecasts.length;
        const actualRate = bucketForecasts.filter((f) => f.resolution === 'yes' || (typeof f.resolution === 'number' && f.resolution > 0.5)).length / bucketForecasts.length;
        buckets.push({ predicted: avgPredicted, actual: actualRate, count: bucketForecasts.length });
      }
    }

    // Calculate Brier score
    const brierSum = resolved.reduce((sum, f) => {
      const predicted = f.community.community_prediction;
      const actual = f.resolution === 'yes' ? 1 : 0;
      return sum + Math.pow(predicted - actual, 2);
    }, 0);
    const brierScore = brierSum / resolved.length;

    // Calibration error
    const calibrationError = buckets.reduce((sum, b) => sum + Math.abs(b.predicted - b.actual), 0) / Math.max(1, buckets.length);

    return {
      calibration: 1 - calibrationError,
      overconfidence: calibrationError > 0.1 ? calibrationError : 0,
      underconfidence: 0,
      sampleSize: resolved.length,
    };
  }

  /** Compare Metaculus to prediction market */
  comparePrediction(
    metaculusPrediction: number,
    marketImpliedProbability: number,
  ): {
    metaculus: number;
    market: number;
    divergence: number;
    signal: string;
    confidence: number;
  } {
    const divergence = Math.abs(metaculusPrediction - marketImpliedProbability);

    let signal = 'No clear edge';
    if (divergence > 0.1) {
      if (metaculusPrediction > marketImpliedProbability) {
        signal = 'Metaculus more bullish than market — potential buy';
      } else {
        signal = 'Metaculus more bearish than market — potential sell';
      }
    }

    return {
      metaculus: metaculusPrediction,
      market: marketImpliedProbability,
      divergence: Math.round(divergence * 1000) / 1000,
      signal,
      confidence: Math.min(0.8, divergence * 2),
    };
  }

  /** Find high-conviction superforecaster predictions */
  findHighConviction(forecasts: MetaculusForecast[], threshold: number = 0.8): MetaculusForecast[] {
    return forecasts.filter((f) => {
      const pred = f.community.superforecaster_prediction ?? f.community.community_prediction;
      return pred > threshold || pred < (1 - threshold);
    });
  }
}
