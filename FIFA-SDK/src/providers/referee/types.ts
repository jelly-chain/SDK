/** Raw response types for the referee provider. */

export interface RawReferee {
  id: string;
  name: string;
  nationality: string;
  confederation: string;
  total_matches: number;
  yellow_cards_avg: number;
  red_cards_avg: number;
  penalties_avg: number;
  fouls_avg: number;
  corners_avg: number;
  strictness: string;
}

export interface RawAssignment {
  fixture_id: string;
  referee: RawReferee;
  assistants: string[];
  fourth_official?: string;
  var?: string;
}

export interface RawRefereeList {
  referees: RawReferee[];
  total: number;
  page: number;
}
