import { Farm } from "./types.js";
export class YieldRouter { async findBestYield(token: string, chain: string): Promise<Farm | null> { return null; } async compareYields(token: string): Promise<Farm[]> { return []; } async getTopYields(limit = 10): Promise<Farm[]> { return []; } }
