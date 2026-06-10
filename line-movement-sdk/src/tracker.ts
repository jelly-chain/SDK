/**
 * LineMovementTracker — historical odds/price tracking for sports & prediction markets
 * Detects steam moves, reverse line movement, sharp money, closing line value
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import type {
  LineSnapshot, LineMovement, SteamMove, ReverseLineMovement,
  SharpMoneyIndicator, ClosingLineValue, MarketEfficiency, MovementType, MarketSport,
} from "./types.js";

export interface LineTrackerConfig extends BaseSDKConfig {
  sport?: MarketSport;
  steamThreshold?: number; // % change to trigger steam
  rlmThreshold?: number; // minimum public % for RLM
  snapshotInterval?: number; // ms
}

interface MarketData { snapshots: LineSnapshot[]; publicSide?: string; publicPercent?: number }

export class LineMovementTracker extends BaseSDK {
  private markets = new Map<string, MarketData>();
  private readonly steamThreshold: number;
  private readonly rlmThreshold: number;

  constructor(config: LineTrackerConfig) {
    super(config, "LineTracker");
    this.steamThreshold = config.steamThreshold || 5;
    this.rlmThreshold = config.rlmThreshold || 60;
  }

  recordSnapshot(snapshot: LineSnapshot): void {
    if (!this.markets.has(snapshot.marketId)) this.markets.set(snapshot.marketId, { snapshots: [] });
    this.markets.get(snapshot.marketId)!.snapshots.push(snapshot);
    this.emit("snapshot", snapshot);
  }

  getMovement(marketId: string, selection?: string): LineMovement[] {
    const data = this.markets.get(marketId);
    if (!data) return [];
    const snaps = selection ? data.snapshots.filter(s => s.selection === selection) : data.snapshots;
    if (snaps.length < 2) return [];
    const movements: LineMovement[] = [];
    for (let i = 1; i < snaps.length; i++) {
      const prev = snaps[i - 1]!;
      const curr = snaps[i]!;
      const change = curr.odds - prev.odds;
      const changePct = prev.odds !== 0 ? (change / Math.abs(prev.odds)) * 100 : 0;
      const probChange = curr.impliedProbability - prev.impliedProbability;
      let type: MovementType = MovementType.NORMAL;
      if (Math.abs(changePct) >= this.steamThreshold) type = MovementType.STEAM;
      if (data.publicPercent && data.publicPercent > this.rlmThreshold && ((data.publicSide === selection && change < 0) || (data.publicSide !== selection && change > 0))) type = MovementType.REVERSE;
      movements.push({ marketId, selection: curr.selection, startOdds: prev.odds, endOdds: curr.odds, startProbability: prev.impliedProbability, endProbability: curr.impliedProbability, change, changePercent: changePct, direction: change > 0 ? "toward" : "against", type, startTime: prev.timestamp, endTime: curr.timestamp, duration: curr.timestamp - prev.timestamp, volumeAtStart: prev.volume, volumeAtEnd: curr.volume, significance: Math.abs(changePct) * (curr.volume / 1000) });
    }
    return movements;
  }

  detectSteamMove(marketId: string): SteamMove[] {
    const data = this.markets.get(marketId);
    if (!data) return [];
    const selections = [...new Set(data.snapshots.map(s => s.selection))];
    return selections.map(sel => {
      const snaps = data.snapshots.filter(s => s.selection === sel).sort((a, b) => a.timestamp - b.timestamp);
      if (snaps.length < 2) return null;
      const first = snaps[0]!;
      const last = snaps[snaps.length - 1]!;
      const totalMovement = Math.abs(last.odds - first.odds) / Math.abs(first.odds) * 100;
      const isSteam = totalMovement >= this.steamThreshold;
      return { marketId, selection: sel, snapshots: snaps, totalMovement, duration: last.timestamp - first.timestamp, confirmed: isSteam && snaps.length >= 3, expectedValue: isSteam ? totalMovement * 0.3 : 0, recommendation: isSteam ? `Steam move detected: ${totalMovement.toFixed(1)}% — consider following` : undefined };
    }).filter((x): x is SteamMove => x !== null && x.confirmed);
  }

  detectReverseLineMovement(marketId: string): ReverseLineMovement[] {
    const data = this.markets.get(marketId);
    if (!data || !data.publicPercent || data.publicPercent < this.rlmThreshold) return [];
    const selections = [...new Set(data.snapshots.map(s => s.selection))];
    return selections.map(sel => {
      const movements = this.getMovement(marketId, sel);
      if (movements.length === 0) return null;
      const latest = movements[movements.length - 1]!;
      const isRLM = (data.publicSide === sel && latest.change < 0) || (data.publicSide !== sel && latest.change > 0);
      if (!isRLM) return null;
      return { marketId, selection: sel, publicSide: data.publicSide!, lineDirection: data.publicSide === sel ? "against_public" : "with_public", publicPercent: data.publicPercent!, lineChange: latest.change, significance: Math.abs(latest.changePercent), expectedValue: Math.abs(latest.changePercent) * 0.4 };
    }).filter((x): x is ReverseLineMovement => x !== null);
  }

  identifySharpMoney(marketId: string): SharpMoneyIndicator[] {
    const steamMoves = this.detectSteamMove(marketId);
    const rlmMoves = this.detectReverseLineMovement(marketId);
    const indicators: SharpMoneyIndicator[] = [];
    for (const steam of steamMoves) {
      const rlm = rlmMoves.find(r => r.selection === steam.selection);
      const confidence = Math.min(95, 50 + steam.snapshots.length * 5 + (rlm ? 20 : 0));
      const evidence = [`Steam move: ${steam.totalMovement.toFixed(1)}% over ${Math.round(steam.duration / 60000)}min`];
      if (rlm) evidence.push(`Reverse line movement: ${rlm.publicPercent}% public on other side`);
      indicators.push({ marketId, selection: steam.selection, confidence, evidence, estimatedSharpPercent: confidence, lineEfficiency: 0.8, recommendation: confidence > 70 ? "Strong sharp money signal — consider following" : "Moderate signal — proceed with caution", expectedValue: steam.expectedValue, timestamp: Date.now() });
    }
    for (const rlm of rlmMoves) {
      if (indicators.find(i => i.selection === rlm.selection)) continue;
      indicators.push({ marketId, selection: rlm.selection, confidence: 60 + rlm.publicPercent * 0.3, evidence: [`RLM: ${rlm.publicPercent}% public on ${rlm.publicSide}, line moved against`], estimatedSharpPercent: 65, lineEfficiency: 0.7, recommendation: "Reverse line movement detected", expectedValue: rlm.expectedValue, timestamp: Date.now() });
    }
    return indicators;
  }

  getClosingLineValue(marketId: string, selection: string, betOdds: number): ClosingLineValue | null {
    const data = this.markets.get(marketId);
    if (!data) return null;
    const snaps = data.snapshots.filter(s => s.selection === selection).sort((a, b) => a.timestamp - b.timestamp);
    if (snaps.length < 2) return null;
    const closing = snaps[snaps.length - 1]!;
    const clv = closing.odds - betOdds;
    const clvPct = betOdds !== 0 ? (clv / Math.abs(betOdds)) * 100 : 0;
    return { marketId, selection, betOdds, closingOdds: closing.odds, clv, clvPercent: clvPct, edge: clvPct * 0.5, beatsClo: clv > 0 };
  }

  getMarketEfficiency(marketId: string): MarketEfficiency {
    const data = this.markets.get(marketId);
    const snaps = data?.snapshots || [];
    const selections = [...new Set(snaps.map(s => s.selection))];
    let totalClv = 0; let beatCount = 0; let count = 0;
    for (const sel of selections) {
      const selSnaps = snaps.filter(s => s.selection === sel).sort((a, b) => a.timestamp - b.timestamp);
      if (selSnaps.length < 2) continue;
      const first = selSnaps[0]!;
      const last = selSnaps[selSnaps.length - 1]!;
      const clv = last.odds - first.odds;
      totalClv += clv;
      if (clv > 0) beatCount++;
      count++;
    }
    return { marketId, sport: MarketSport.GENERIC, efficiency: count > 0 ? beatCount / count : 0.5, sampleSize: count, avgClv: count > 0 ? totalClv / count : 0, beatRate: count > 0 ? beatCount / count : 0.5, sharpeRatio: 0, analysisPeriod: { start: snaps[0]?.timestamp || 0, end: snaps[snaps.length - 1]?.timestamp || 0 } };
  }

  getOddsHistory(marketId: string, selection?: string): LineSnapshot[] {
    const data = this.markets.get(marketId);
    if (!data) return [];
    return selection ? data.snapshots.filter(s => s.selection === selection) : [...data.snapshots];
  }

  setPublicSide(marketId: string, selection: string, percent: number): void {
    if (!this.markets.has(marketId)) this.markets.set(marketId, { snapshots: [] });
    const data = this.markets.get(marketId)!;
    data.publicSide = selection;
    data.publicPercent = percent;
  }

  clearMarket(marketId: string): void { this.markets.delete(marketId); }
  getMarketCount(): number { return this.markets.size; }
}
