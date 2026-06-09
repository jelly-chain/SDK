/** Raw response types from football-api. */
export interface football apiMatchRaw {
  id: string | number;
  [key: string]: unknown;
}

export interface football apiTeamRaw {
  id: string | number;
  name: string;
  [key: string]: unknown;
}
