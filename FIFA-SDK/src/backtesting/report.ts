import { BacktestResult } from './backtest-runner.js';

export interface BacktestReportData {
  generatedAt: string;
  results: BacktestResult[];
  summary: {
    averageAccuracy: number;
    bestYear: number;
    worstYear: number;
    overallCalibrationError: number;
  };
}

/** Generates formatted reports from backtest results. */
export class BacktestReport {
  generate(results: BacktestResult[]): BacktestReportData {
    if (results.length === 0) {
      return {
        generatedAt: new Date().toISOString(),
        results: [],
        summary: { averageAccuracy: 0, bestYear: 0, worstYear: 0, overallCalibrationError: 0 },
      };
    }

    const avgAccuracy = results.reduce((s, r) => s + r.accuracy, 0) / results.length;
    const best = results.reduce((a, b) => (a.accuracy > b.accuracy ? a : b));
    const worst = results.reduce((a, b) => (a.accuracy < b.accuracy ? a : b));
    const avgCal = results.reduce((s, r) => s + r.calibrationError, 0) / results.length;

    return {
      generatedAt: new Date().toISOString(),
      results,
      summary: {
        averageAccuracy: avgAccuracy,
        bestYear: best.tournamentYear,
        worstYear: worst.tournamentYear,
        overallCalibrationError: avgCal,
      },
    };
  }

  toMarkdown(report: BacktestReportData): string {
    const lines = [
      '# Backtest Report',
      `Generated: ${report.generatedAt}`,
      '',
      '## Summary',
      `- Average Accuracy: ${(report.summary.averageAccuracy * 100).toFixed(1)}%`,
      `- Best Year: ${report.summary.bestYear}`,
      `- Worst Year: ${report.summary.worstYear}`,
      `- Overall Calibration Error: ${report.summary.overallCalibrationError.toFixed(3)}`,
    ];
    return lines.join('\n');
  }
}
