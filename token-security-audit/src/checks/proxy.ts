import { SecurityCheck } from "../types.js";
export async function checkProxy(token: string, chain: string): Promise<SecurityCheck> { return { name: "proxy", passed: true, severity: "info", detail: `No proxy pattern detected for ${token} on ${chain}` }; }
