export class CorrelationAnalyzer {
  pearson(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    const num = x.reduce((sum, xi, i) => sum + (xi - meanX) * ((y[i] ?? 0) - meanY), 0);
    const denX = Math.sqrt(x.reduce((s, xi) => s + Math.pow(xi - meanX, 2), 0));
    const denY = Math.sqrt(y.reduce((s, yi) => s + Math.pow(yi - meanY, 2), 0));
    return denX * denY === 0 ? 0 : num / (denX * denY);
  }

  correlationMatrix(assets: { id: string; prices: number[] }[]): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};
    for (const a of assets) {
      result[a.id] = {};
      for (const b of assets) {
        result[a.id]![b.id] = this.pearson(a.prices, b.prices);
      }
    }
    return result;
  }
}
