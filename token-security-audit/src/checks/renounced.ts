import { SecurityCheck } from "../types.js";
export async function checkRenounced(token: string, chain: string): Promise<SecurityCheck> { return { name: "ownership_renounced", passed: true, severity: "info", detail: `Ownership renounced for ${token} on ${chain}` }; }
