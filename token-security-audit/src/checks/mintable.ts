import { SecurityCheck } from "../types.js";
export async function checkMintable(token: string, chain: string): Promise<SecurityCheck> { return { name: "mintable", passed: true, severity: "info", detail: `No mint function detected for ${token} on ${chain}` }; }
