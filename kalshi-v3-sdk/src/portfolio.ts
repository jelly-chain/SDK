import type { KalshiPortfolio, KalshiPosition, KalshiMarket } from './types.js';
import { KalshiV3Client } from './client.js';

export class KalshiPortfolioManager {
  constructor(private readonly client: KalshiV3Client) {}

  async getBalance(): Promise<number> {
    // Would call /portfolio/balance
    return 0;
  }

  async getPositions(): Promise<KalshiPosition[]> {
    // Would call /portfolio/positions
    return [];
  }

  async getPortfolio(): Promise<KalshiPortfolio> {
    const positions = await this.getPositions();
    const totalValue = positions.reduce((sum, p) => sum + p.current_value, 0);
    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);

    return {
      balance: await this.getBalance(),
      positions,
      total_value: totalValue,
      total_pnl: totalPnl,
    };
  }

  calculateKelly(params: {
    probability: number;
    yesPrice: number;
    bankroll: number;
    fraction?: number;
  }): { side: 'yes' | 'no'; stake: number; edge: number } {
    const { probability, yesPrice, bankroll, fraction = 0.25 } = params;
    const noPrice = 1 - yesPrice;

    const yesEdge = probability * (1 / yesPrice - 1) - (1 - probability);
    const noEdge = (1 - probability) * (1 / noPrice - 1) - probability;

    if (yesEdge > noEdge && yesEdge > 0) {
      const kelly = yesEdge / (1 / yesPrice - 1);
      return { side: 'yes', stake: Math.round(bankroll * kelly * fraction * 100) / 100, edge: Math.round(yesEdge * 1000) / 1000 };
    } else if (noEdge > 0) {
      const kelly = noEdge / (1 / noPrice - 1);
      return { side: 'no', stake: Math.round(bankroll * kelly * fraction * 100) / 100, edge: Math.round(noEdge * 1000) / 1000 };
    }

    return { side: 'yes', stake: 0, edge: 0 };
  }
}
