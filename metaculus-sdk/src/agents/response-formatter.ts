/**
 * Format Metaculus data for agent-friendly output
 */

import type { MetaculusQuestion, MetaculusCommunityPrediction, MetaculusForecast } from '../types.js';

export class ResponseFormatter {
  static formatQuestion(question: MetaculusQuestion): string {
    return `🔮 ${question.title}\n   Type: ${question.question_type} | Status: ${question.status}\n   Category: ${question.category} | Predictions: ${question.close_time ?? 'Open'}`;
  }

  static formatQuestions(questions: MetaculusQuestion[]): string {
    if (questions.length === 0) return 'No questions found.';
    return questions.map((q, i) => `${i + 1}. ${this.formatQuestion(q)}`).join('\n\n');
  }

  static formatPrediction(question: MetaculusQuestion, community: MetaculusCommunityPrediction): string {
    const parts: string[] = [];
    parts.push(`## ${question.title}`);
    parts.push(`\nCommunity Prediction: ${(community.community_prediction * 100).toFixed(1)}%`);
    parts.push(`Number of Predictions: ${community.num_predictions}`);

    if (community.superforecaster_prediction !== undefined) {
      parts.push(`Superforecaster Prediction: ${(community.superforecaster_prediction * 100).toFixed(1)}%`);
    }

    if (community.distribution) {
      parts.push(`\nDistribution:`);
      parts.push(`  Mean: ${(community.distribution.mean * 100).toFixed(1)}%`);
      parts.push(`  Median: ${(community.distribution.median * 100).toFixed(1)}%`);
      parts.push(`  Std Dev: ${(community.distribution.std * 100).toFixed(1)}%`);
    }

    return parts.join('\n');
  }

  static formatForecast(forecast: MetaculusForecast): string {
    const parts: string[] = [];
    parts.push(`## ${forecast.question.title}`);
    parts.push(`Status: ${forecast.resolved ? 'Resolved' : 'Open'}`);

    if (forecast.resolved) {
      parts.push(`Resolution: ${forecast.resolution}`);
    }

    parts.push(`\nCommunity Prediction: ${(forecast.community.community_prediction * 100).toFixed(1)}%`);
    parts.push(`Number of Predictors: ${forecast.community.num_predictions}`);

    return parts.join('\n');
  }

  static formatForComparison(
    metaculusPrediction: number,
    marketImplied: number,
    platform: string,
  ): string {
    const divergence = Math.abs(metaculusPrediction - marketImplied);
    let signal = 'Predictions aligned';

    if (divergence > 0.1) {
      signal = metaculusPrediction > marketImplied
        ? 'Metaculus more bullish than market — potential edge'
        : 'Metaculus more bearish than market — potential edge';
    }

    return `## Metaculus vs ${platform}\n\nMetaculus: ${(metaculusPrediction * 100).toFixed(1)}%\n${platform}: ${(marketImplied * 100).toFixed(1)}%\nDivergence: ${(divergence * 100).toFixed(1)}%\nSignal: ${signal}`;
  }
}
