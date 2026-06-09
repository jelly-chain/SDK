/** Raw response types from sportradar. */
export interface sportradarMatchRaw {
  id: string | number;
  [key: string]: unknown;
}

export interface sportradarTeamRaw {
  id: string | number;
  name: string;
  [key: string]: unknown;
}
