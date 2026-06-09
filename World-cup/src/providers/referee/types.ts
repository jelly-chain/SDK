/** Raw response types from referee. */
export interface refereeMatchRaw {
  id: string | number;
  [key: string]: unknown;
}

export interface refereeTeamRaw {
  id: string | number;
  name: string;
  [key: string]: unknown;
}
