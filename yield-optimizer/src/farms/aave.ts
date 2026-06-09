import { Farm, HarvestResult } from "../types.js";
export class AaveFarms { async getFarms(): Promise<Farm[]> { return []; } async getApy(asset: string): Promise<number> { return 0; } async harvest(asset: string): Promise<HarvestResult> { return { protocol: "aave", pool: asset, rewards: [], gasUsed: "0" }; } }
