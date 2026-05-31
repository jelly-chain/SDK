/**
 * Rest Day Advantage Module
 * NBA/NHL playoff scheduling edge quantification.
 */

export interface ScheduleContext {
  teamId: string;
  gamesPlayed: number;
  daysSinceLastGame: number;
  daysUntilNextGame: number;
  isBackToBack: boolean;
  isThreeInFour: boolean;
  isFourInFive: boolean;
  isFiveInSeven: boolean;
  travelDays: number;
  homeGamesLast7: number;
  awayGamesLast7: number;
}

export interface RestAdvantageResult {
  homeTeam: ScheduleContext;
  awayTeam: ScheduleContext;
  restAdvantage: number; // Positive = home advantage
  scheduleAdvantage: number; // Positive = home advantage
  combinedAdvantage: number;
  factors: string[];
  bettingAngles: string[];
  confidence: number;
}

export interface PlayoffSchedulingEdge {
  seriesId: string;
  team1: ScheduleContext;
  team2: ScheduleContext;
  restDaysTeam1: number[];
  restDaysTeam2: number[];
  backToBacksTeam1: number;
  backToBacksTeam2: number;
  travelDaysTeam1: number;
  travelDaysTeam2: number;
  edge: 'team1' | 'team2' | 'neutral';
  magnitude: number;
}

export class RestAdvantageEngine {
  /** Calculate rest advantage for a matchup */
  calculate(home: ScheduleContext, away: ScheduleContext): RestAdvantageResult {
    let restAdvantage = 0;
    let scheduleAdvantage = 0;
    const factors: string[] = [];
    const bettingAngles: string[] = [];

    // Rest days advantage
    const restDiff = home.daysSinceLastGame - away.daysSinceLastGame;
    restAdvantage += restDiff * 0.03; // 3% per rest day advantage

    if (restDiff >= 2) {
      factors.push(`Home team has ${restDiff} more rest days`);
      bettingAngles.push('Fresh home team — consider home spread');
    } else if (restDiff <= -2) {
      factors.push(`Away team has ${Math.abs(restDiff)} more rest days`);
      bettingAngles.push('Rest advantage to away — potential upset spot');
    }

    // Back-to-back penalty
    if (away.isBackToBack && !home.isBackToBack) {
      restAdvantage += 0.08;
      factors.push('Away team on back-to-back');
      bettingAngles.push('B2B away team — fatigue factors in 2nd half');
    } else if (home.isBackToBack && !away.isBackToBack) {
      restAdvantage -= 0.08;
      factors.push('Home team on back-to-back');
    }

    // Three in four days
    if (away.isThreeInFour) {
      scheduleAdvantage += 0.05;
      factors.push('Away team playing 3rd game in 4 days');
    }
    if (home.isThreeInFour) {
      scheduleAdvantage -= 0.05;
      factors.push('Home team playing 3rd game in 4 days');
    }

    // Four in five days (extreme)
    if (away.isFourInFive) {
      scheduleAdvantage += 0.08;
      factors.push('Away team on 4th game in 5 days — severe fatigue');
      bettingAngles.push('Heavy schedule spot for away — strong home lean');
    }

    // Five in seven days (NHL road trips)
    if (away.isFiveInSeven) {
      scheduleAdvantage += 0.06;
      factors.push('Away team on 5th game in 7 days');
    }

    // Travel days
    const travelDiff = home.travelDays - away.travelDays;
    if (travelDiff < 0) {
      scheduleAdvantage += Math.abs(travelDiff) * 0.02;
      factors.push(`Away team has ${Math.abs(travelDiff)} more travel day(s)`);
    }

    // Home/away balance
    const homeBalance = home.homeGamesLast7 - home.awayGamesLast7;
    const awayBalance = away.homeGamesLast7 - away.awayGamesLast7;
    if (homeBalance < -2) {
      factors.push('Home team has been on road a lot — extra motivation');
    }
    if (awayBalance > 2) {
      factors.push('Away team has been home a lot — road fatigue');
    }

    const combinedAdvantage = restAdvantage + scheduleAdvantage;
    const confidence = Math.min(0.8, 0.5 + Math.abs(combinedAdvantage));

    return {
      homeTeam: home,
      awayTeam: away,
      restAdvantage: Math.round(restAdvantage * 100) / 100,
      scheduleAdvantage: Math.round(scheduleAdvantage * 100) / 100,
      combinedAdvantage: Math.round(combinedAdvantage * 100) / 100,
      factors,
      bettingAngles,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /** Analyze playoff scheduling edge */
  analyzePlayoffScheduling(
    seriesId: string,
    team1: ScheduleContext,
    team2: ScheduleContext,
    restDaysTeam1: number[],
    restDaysTeam2: number[],
  ): PlayoffSchedulingEdge {
    const backToBacksTeam1 = restDaysTeam1.filter((d) => d === 0).length;
    const backToBacksTeam2 = restDaysTeam2.filter((d) => d === 0).length;

    const avgRestTeam1 = restDaysTeam1.reduce((a, b) => a + b, 0) / restDaysTeam1.length;
    const avgRestTeam2 = restDaysTeam2.reduce((a, b) => a + b, 0) / restDaysTeam2.length;

    const restDiff = avgRestTeam1 - avgRestTeam2;
    const b2bDiff = backToBacksTeam2 - backToBacksTeam1;
    const travelDiff = team2.travelDays - team1.travelDays;

    const magnitude = (restDiff * 0.3 + b2bDiff * 0.5 + travelDiff * 0.2) / 2;

    return {
      seriesId,
      team1,
      team2,
      restDaysTeam1,
      restDaysTeam2,
      backToBacksTeam1,
      backToBacksTeam2,
      travelDaysTeam1: team1.travelDays,
      travelDaysTeam2: team2.travelDays,
      edge: magnitude > 0.1 ? 'team1' : magnitude < -0.1 ? 'team2' : 'neutral',
      magnitude: Math.round(Math.abs(magnitude) * 100) / 100,
    };
  }

  /** Get schedule density score */
  scheduleDensity(context: ScheduleContext): {
    density: number;
    classification: string;
    impact: string;
  } {
    const gamesPerWeek = 7 / Math.max(1, context.daysSinceLastGame + context.daysUntilNextGame) * 2;
    const density = Math.min(1, gamesPerWeek / 4);

    const classification =
      density > 0.8 ? 'extreme' :
      density > 0.6 ? 'heavy' :
      density > 0.4 ? 'moderate' : 'light';

    const impact =
      classification === 'extreme' ? 'Expect significant fatigue — unders and opponent favored' :
      classification === 'heavy' ? 'Fatigue will factor — watch 2nd half performance' :
      classification === 'moderate' ? 'Normal schedule — no significant edge' :
      'Well-rested — expect high energy';

    return { density: Math.round(density * 100) / 100, classification, impact };
  }
}
