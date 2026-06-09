/** Raw response types from weather. */
export interface weatherMatchRaw {
  id: string | number;
  [key: string]: unknown;
}

export interface weatherTeamRaw {
  id: string | number;
  name: string;
  [key: string]: unknown;
}
