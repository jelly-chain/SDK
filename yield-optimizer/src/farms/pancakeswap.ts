import { Farm, HarvestResult } from "../types.js";
export class PancakeSwapFarms { async getFarms(): Promise<Farm[]> { return []; } async getApy(pool: string): Promise<number> { return 0; } async harvest(pool: string): Promise<HarvestResult> { return { protocol: "pancakeswap", pool, rewards: [], gasUsed: "0" }; } }
