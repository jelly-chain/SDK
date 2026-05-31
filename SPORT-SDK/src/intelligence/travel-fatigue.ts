/**
 * Travel Fatigue Calculator
 * Back-to-backs, time zone changes, altitude adjustments.
 */

export interface TravelInfo {
  teamId: string;
  fromVenue: { latitude: number; longitude: number; altitude: number; timezone: string };
  toVenue: { latitude: number; longitude: number; altitude: number; timezone: string };
  travelDate: string;
  travelMethod: 'flight' | 'bus' | 'train';
  daysBetweenGames: number;
  isBackToBack: boolean;
  isThirdInFourDays: boolean;
  isFourthInFiveDays: boolean;
}

export interface FatigueReport {
  teamId: string;
  fatigueScore: number; // 0-1, higher = more fatigued
  factors: {
    timezoneShift: number; // hours
    distanceKm: number;
    altitudeChange: number; // meters
    restDays: number;
    isBackToBack: boolean;
    scheduleDensity: number; // games per week
  };
  impact: {
    performanceDecline: number; // Estimated % decline
    injuryRisk: number; // 0-1
    shootingDecline: number; // Estimated % decline
    defensiveDecline: number; // Estimated % decline
  };
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  bettingAngle: string;
}

export interface RestDayAdvantage {
  homeTeamId: string;
  awayTeamId: string;
  homeRestDays: number;
  awayRestDays: number;
  restAdvantage: number; // Positive = home advantage
  isScheduleSpot: boolean; // True if one team has significant schedule advantage
  factors: string[];
}

export class TravelFatigueEngine {
  /** Calculate fatigue from travel */
  calculateFatigue(travel: TravelInfo): FatigueReport {
    // Timezone shift impact
    const timezoneShift = Math.abs(
      this.parseTimezone(travel.fromVenue.timezone) - this.parseTimezone(travel.toVenue.timezone)
    );
    const timezoneImpact = Math.min(1, timezoneShift / 6); // 6 hours = max impact

    // Distance calculation (Haversine)
    const distanceKm = this.calculateDistance(
      travel.fromVenue.latitude,
      travel.fromVenue.longitude,
      travel.toVenue.latitude,
      travel.toVenue.longitude,
    );
    const distanceImpact = Math.min(1, distanceKm / 5000); // 5000km = max impact

    // Altitude change
    const altitudeChange = Math.abs(travel.toVenue.altitude - travel.fromVenue.altitude);
    const altitudeImpact = Math.min(1, altitudeChange / 2000); // 2000m change = max impact

    // Rest days impact
    const restImpact = travel.daysBetweenGames >= 3 ? 0 :
      travel.daysBetweenGames === 2 ? 0.1 :
      travel.daysBetweenGames === 1 ? 0.3 : 0.5;

    // Schedule density
    const scheduleDensity = 7 / Math.max(1, travel.daysBetweenGames);

    // Combined fatigue score
    const fatigueScore = Math.min(1,
      timezoneImpact * 0.25 +
      distanceImpact * 0.15 +
      altitudeImpact * 0.15 +
      restImpact * 0.3 +
      (travel.isBackToBack ? 0.1 : 0) +
      (travel.isThirdInFourDays ? 0.05 : 0)
    );

    // Performance impact estimates
    const performanceDecline = fatigueScore * 8; // Up to 8% decline
    const injuryRisk = Math.min(1, fatigueScore * 1.5); // Higher injury risk
    const shootingDecline = fatigueScore * 6; // Shooting drops more with fatigue
    const defensiveDecline = fatigueScore * 5; // Defensive effort drops

    // Risk level
    const riskLevel: FatigueReport['riskLevel'] =
      fatigueScore > 0.7 ? 'critical' :
      fatigueScore > 0.5 ? 'high' :
      fatigueScore > 0.3 ? 'moderate' : 'low';

    // Betting angle
    let bettingAngle = 'No significant fatigue edge';
    if (travel.isBackToBack) {
      bettingAngle = 'Back-to-back: consider unders and opponent spread';
    } else if (timezoneShift > 3) {
      bettingAngle = 'Major timezone shift: slow start expected';
    } else if (altitudeChange > 1000) {
      bettingAngle = 'Significant altitude change: conditioning matters';
    }

    return {
      teamId: travel.teamId,
      fatigueScore: Math.round(fatigueScore * 100) / 100,
      factors: {
        timezoneShift,
        distanceKm: Math.round(distanceKm),
        altitudeChange,
        restDays: travel.daysBetweenGames,
        isBackToBack: travel.isBackToBack,
        scheduleDensity: Math.round(scheduleDensity * 10) / 10,
      },
      impact: {
        performanceDecline: Math.round(performanceDecline * 10) / 10,
        injuryRisk: Math.round(injuryRisk * 100) / 100,
        shootingDecline: Math.round(shootingDecline * 10) / 10,
        defensiveDecline: Math.round(defensiveDecline * 10) / 10,
      },
      riskLevel,
      bettingAngle,
    };
  }

  /** Calculate rest day advantage between two teams */
  calculateRestAdvantage(
    homeTeamId: string,
    awayTeamId: string,
    homeRestDays: number,
    awayRestDays: number,
  ): RestDayAdvantage {
    const restAdvantage = homeRestDays - awayRestDays;
    const isScheduleSpot = Math.abs(restAdvantage) >= 2;
    const factors: string[] = [];

    if (restAdvantage > 0) {
      factors.push(`Home team has ${restAdvantage} more rest day(s)`);
      if (restAdvantage >= 3) factors.push('Significant rest advantage — fresh legs matter');
    } else if (restAdvantage < 0) {
      factors.push(`Away team has ${Math.abs(restAdvantage)} more rest day(s)`);
      if (restAdvantage <= -3) factors.push('Away team well-rested — potential upset factor');
    }

    if (homeRestDays === 0) factors.push('Home team on back-to-back — fatigue risk');
    if (awayRestDays === 0) factors.push('Away team on back-to-back — fatigue risk');

    if (homeRestDays >= 4) factors.push('Home team may be rusty from extended rest');
    if (awayRestDays >= 4) factors.push('Away team may be rusty from extended rest');

    return {
      homeTeamId,
      awayTeamId,
      homeRestDays,
      awayRestDays,
      restAdvantage,
      isScheduleSpot,
      factors,
    };
  }

  /** Haversine distance calculation */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private parseTimezone(tz: string): number {
    // Simple timezone offset parser
    const map: Record<string, number> = {
      'EST': -5, 'CST': -6, 'MST': -7, 'PST': -8,
      'GMT': 0, 'CET': 1, 'EET': 2, 'IST': 5.5,
      'JST': 9, 'AEST': 10, 'NZST': 12,
    };
    return map[tz] ?? 0;
  }
}
