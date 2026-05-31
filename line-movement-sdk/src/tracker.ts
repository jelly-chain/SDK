import type { OddsSnapshot, LineMovementData, SteamMove } from './types.js';

export class LineMovementTracker {
  private movements: Map<string, LineMovementData> = new Map();

  record(snapshot: OddsSnapshot): void {
    const key = `${snapshot.fixtureId}-${snapshot.market}`;
    let data = this.movements.get(key);

    if (!data) {
      data = {
        fixtureId: snapshot.fixtureId,
        market: snapshot.market,
        snapshots: [snapshot],
        openingLine: snapshot,
        currentLine: snapshot,
        movement: { homeOddsDelta: 0, awayOddsDelta: 0, direction: 'stable', sharpMoney: 'none' },
        steamMoves: [],
      };
      this.movements.set(key, data);
    } else {
      data.snapshots.push(snapshot);
      const prev = data.currentLine;
      data.currentLine = snapshot;

      data.movement.homeOddsDelta = snapshot.homeOdds - data.openingLine.homeOdds;
      data.movement.awayOddsDelta = snapshot.awayOdds - data.openingLine.awayOdds;

      const homeChange = snapshot.homeOdds - prev.homeOdds;
      data.movement.direction = Math.abs(homeChange) < 0.05 ? 'stable' : homeChange < 0 ? 'toward-home' : 'toward-away';

      // Steam move detection
      const timeDiff = new Date(snapshot.timestamp).getTime() - new Date(prev.timestamp).getTime();
      if (timeDiff < 300000 && Math.abs(homeChange) > 0.15) {
        const steam: SteamMove = {
          timestamp: snapshot.timestamp,
          direction: homeChange < 0 ? 'home' : 'away',
          magnitude: Math.abs(homeChange),
          sportsbook: snapshot.sportsbook,
          possibleCauses: ['sharp-money', 'injury-news'],
        };
        data.steamMoves.push(steam);
      }

      // Sharp money detection
      const homeSteams = data.steamMoves.filter((s) => s.direction === 'home').length;
      const awaySteams = data.steamMoves.filter((s) => s.direction === 'away').length;
      data.movement.sharpMoney = homeSteams > awaySteams + 1 ? 'home' : awaySteams > homeSteams + 1 ? 'away' : 'unclear';
    }
  }

  getMovement(fixtureId: string, market: string): LineMovementData | undefined {
    return this.movements.get(`${fixtureId}-${market}`);
  }

  getAllMovements(): LineMovementData[] {
    return Array.from(this.movements.values());
  }

  getChartData(fixtureId: string, market: string): { timestamps: string[]; homeOdds: number[]; awayOdds: number[] } | null {
    const data = this.movements.get(`${fixtureId}-${market}`);
    if (!data) return null;
    return {
      timestamps: data.snapshots.map((s) => s.timestamp),
      homeOdds: data.snapshots.map((s) => s.homeOdds),
      awayOdds: data.snapshots.map((s) => s.awayOdds),
    };
  }
}
