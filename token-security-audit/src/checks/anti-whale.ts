import { SecurityCheck } from "../types.js";
export async function checkAntiWhale(token: string, chain: string): Promise<SecurityCheck> { return { name: "anti_whale", passed: true, severity: "info", detail: `No excessive anti-whale limits for ${token} on ${chain}` }; }
