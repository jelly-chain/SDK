export interface SecurityCheck { name: string; passed: boolean; severity: "info" | "warning" | "critical"; detail: string; }
export interface AuditReport { token: string; chain: string; overall: "safe" | "warning" | "danger"; score: number; checks: SecurityCheck[]; timestamp: number; }
export type CheckFunction = (token: string, chain: string) => Promise<SecurityCheck>;
