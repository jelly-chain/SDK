/**
 * Input validation for Sportradar SDK
 */

export class Validators {
  static isValidSportId(id: string): boolean {
    return /^sr:sport:\d+$/.test(id);
  }

  static isValidTournamentId(id: string): boolean {
    return /^sr:tournament:\d+$/.test(id);
  }

  static isValidSeasonId(id: string): boolean {
    return /^sr:season:\d+$/.test(id);
  }

  static isValidMatchId(id: string): boolean {
    return /^sr:sport_event:\d+$/.test(id) || /^sr:match:\d+$/.test(id);
  }

  static isValidTeamId(id: string): boolean {
    return /^sr:team:\d+$/.test(id) || /^sr:competitor:\d+$/.test(id);
  }

  static isValidPlayerId(id: string): boolean {
    return /^sr:player:\d+$/.test(id);
  }

  static isValidDate(date: string): boolean {
    return !isNaN(Date.parse(date));
  }

  static validateApiKey(key: string | undefined): string {
    if (!key || key.trim() === '') {
      throw new Error('Sportradar API key is required. Set SPORTRADAR_API_KEY environment variable.');
    }
    return key.trim();
  }

  static sanitizeQuery(query: string): string {
    return query.replace(/[<>\"'&]/g, '').trim().slice(0, 200);
  }
}
