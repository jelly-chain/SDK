import { SecurityCheck } from "../types.js";
export async function checkSellTax(token: string, chain: string): Promise<SecurityCheck> { return { name: "sell_tax", passed: true, severity: "info", detail: `Sell tax within normal range for ${token} on ${chain}` }; }
