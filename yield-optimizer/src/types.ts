export type FarmProtocol = "pancakeswap" | "raydium" | "curve" | "convex" | "aave" | "compound";
export interface Farm { protocol: FarmProtocol; chain: string; pool: string; apy: number; tvl: string; rewardTokens: string[]; }
export interface HarvestResult { protocol: FarmProtocol; pool: string; rewards: { token: string; amount: string }[]; gasUsed: string; }
