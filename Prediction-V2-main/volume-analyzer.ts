export interface VolumeAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  ratio: number;
  isSpike: boolean;
  score: number;
}

export class VolumeAnalyzer {
  analyze(currentVolume: number, historicalVolumes: number[]): VolumeAnalysis {
    if (historicalVolumes.length === 0) return { trend: 'stable', ratio: 1, isSpike: false, score: 0.5 };
    const avg = historicalVolumes.reduce((a, b) => a + b, 0) / historicalVolumes.length;
    const ratio = avg > 0 ? currentVolume / avg : 1;
    const trend = ratio > 1.2 ? 'increasing' : ratio < 0.8 ? 'decreasing' : 'stable';
    const isSpike = ratio >= 2.5;
    const score = Math.min(1, Math.max(0, (ratio - 0.5) / 2));
    return { trend, ratio, isSpike, score };
  }
}
