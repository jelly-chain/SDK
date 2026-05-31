import type { FifaNamespace, PredictionNamespace } from '../sdk.js';

export interface BacktestInput {
  tournamentYear: number;
  marketType: string;
  strategy?: string;
}

export interface BacktestResult {
  tournamentYear: number;
  totalPredictions: number;
  correct: number;
  accuracy: number;
  averageConfidence: number;
  calibrationError: number;
  profitLoss?: number;
}

/** Runs historical backtests against past World Cup data. */
export class BacktestRunner {
  constructor(
    private readonly fifa: FifaNamespace,
    private readonly prediction: PredictionNamespace,
  ) {}

  /** Run a backtest for a given World Cup year and market type. */
  async run(input: BacktestInput): Promise<BacktestResult> {
    const { tournamentYear, marketType } = input;
    const history = await this.fifa.history.worldCup(tournamentYear);

    return {
      tournamentYear,
      totalPredictions: 0,
      correct: 0,
      accuracy: 0,
      averageConfidence: 0,
      calibrationError: 0,
    };
  }

  /** Compare model accuracy across multiple tournament years. */
  async compareYears(years: number[], marketType: string): Promise<BacktestResult[]> {
    return Promise.all(years.map(year => this.run({ tournamentYear: year, marketType })));
  }
}
