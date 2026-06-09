/** Raw response types from news. */
export interface newsMatchRaw {
  id: string | number;
  [key: string]: unknown;
}

export interface newsTeamRaw {
  id: string | number;
  name: string;
  [key: string]: unknown;
}
