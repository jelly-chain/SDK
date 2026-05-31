export interface LiquidityAnalysis {
  score: number;
  depth: 'thin' | 'moderate' | 'deep';
  slippageRisk: number;
  impactFactor: number;
}

export class LiquidityAnalyzer {
  analyze(tvlUsd: number, volume24h: number): LiquidityAnalysis {
    const depth = tvlUsd >= 10_000_000 ? 'deep' : tvlUsd >= 1_000_000 ? 'moderate' : 'thin';
    const score = Math.min(1, tvlUsd / 10_000_000);
    const ratio = tvlUsd > 0 ? volume24h / tvlUsd : 0;
    const slippageRisk = Math.min(1, ratio * 2);
    const impactFactor = depth === 'thin' ? 0.8 : depth === 'moderate' ? 0.4 : 0.1;
    return { score, depth, slippageRisk, impactFactor };
  }
}
