import { MockConfig } from "../types.js";
export class MockRpcClient { constructor(private config: MockConfig) {} async call(_method: string, _params: unknown[]): Promise<unknown> { return null; } async getBlockNumber(): Promise<number> { return this.config.blockNumber; } async getGasPrice(): Promise<string> { return this.config.gasPrice; } }
