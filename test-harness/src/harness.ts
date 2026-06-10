/**
 * TestHarness — testing utilities suite for all Jelly Chain SDKs
 * Provides: mock providers, fixture generation, assertion helpers, coverage, forks
 */

import type { ChainId } from "@jellychain/shared-types";

export interface TestContext {
  chainId: ChainId;
  rpcUrl: string;
  blockNumber: number;
  accounts: TestAccount[];
  contracts: TestContract[];
  mocks: Map<string, unknown>;
  snapshots: string[];
}

export interface TestAccount {
  address: string;
  privateKey: string;
  balance: bigint;
  nonce: number;
  label?: string;
}

export interface TestContract {
  address: string;
  abi: unknown[];
  bytecode: string;
  label?: string;
}

export interface MockProvider {
  getBalance: (address: string) => Promise<bigint>;
  getBlockNumber: () => Promise<number>;
  getCode: (address: string) => Promise<string>;
  call: (params: { to: string; data: string }) => Promise<string>;
  estimateGas: (params: { from: string; to: string; data?: string }) => Promise<bigint>;
  sendTransaction: (tx: { from: string; to: string; data?: string; value?: bigint; gasLimit?: bigint }) => Promise<{ hash: string; wait: () => Promise<{ status: number; gasUsed: bigint; logs: unknown[] }> }>;
  getLogs: (filter: { fromBlock?: number; toBlock?: number; address?: string; topics?: (string | null)[] }) => Promise<unknown[]>;
}

export class TestHarness {
  private context: TestContext;
  private testResults: TestResult[] = [];

  constructor(chainId: ChainId = 1) {
    this.context = {
      chainId, rpc: "http://localhost:8545", blockNumber: 18000000,
      accounts: this.generateTestAccounts(),
      contracts: [],
      mocks: new Map(),
      snapshots: [],
    };
  }

  private generateTestAccounts(): TestAccount[] {
    const accounts: TestAccount[] = [];
    for (let i = 0; i < 10; i++) {
      accounts.push({
        address: `0x${(i + 1).toString(16).padStart(40, "0")}`,
        privateKey: `${"0".repeat(63)}${i + 1}`,
        balance: BigInt(1000000000000000000000), // 1000 ETH
        nonce: 0,
        label: i === 0 ? "deployer" : i === 1 ? "user1" : i === 2 ? "user2" : `account${i}`,
      });
    }
    return accounts;
  }

  createMockProvider(overrides?: Partial<MockProvider>): MockProvider {
    const defaultProvider: MockProvider = {
      getBalance: async (addr: string) => {
        const account = this.context.accounts.find(a => a.address.toLowerCase() === addr.toLowerCase());
        return account?.balance || 0n;
      },
      getBlockNumber: async () => this.context.blockNumber++,
      getCode: async () => "0x",
      call: async () => "0x",
      estimateGas: async () => 21000n,
      sendTransaction: async (tx) => ({
        hash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
        wait: async () => ({ status: 1, gasUsed: 21000n, logs: [] }),
      }),
      getLogs: async () => [],
    };
    const mock = { ...defaultProvider, ...overrides };
    return mock;
  }

  snapshot(): string {
    const snap = JSON.stringify({ blockNumber: this.context.blockNumber, accounts: this.context.accounts.map(a => ({ addr: a.address, balance: a.balance.toString(), nonce: a.nonce })) });
    this.context.snapshots.push(snap);
    return snap;
  }

  restore(snapshot?: string): void {
    const snap = snapshot || this.context.snapshots.pop();
    if (!snap) throw new Error("No snapshot to restore");
    const data = JSON.parse(snap);
    this.context.blockNumber = data.blockNumber;
    for (const a of data.accounts) {
      const account = this.context.accounts.find(acc => acc.address === a.addr);
      if (account) { account.balance = BigInt(a.balance); account.nonce = a.nonce; }
    }
  }

  impersonateAccount(address: string): void {
    this.context.mocks.set(`impersonate:${address}`, true);
  }

  setBalance(address: string, balance: bigint): void {
    const account = this.context.accounts.find(a => a.address.toLowerCase() === address.toLowerCase());
    if (account) account.balance = balance;
    else this.context.accounts.push({ address, privateKey: "0x0", balance, nonce: 0 });
  }

  setNonce(address: string, nonce: number): void {
    const account = this.context.accounts.find(a => a.address.toLowerCase() === address.toLowerCase());
    if (account) account.nonce = nonce;
  }

  mineBlock(count = 1): void {
    this.context.blockNumber += count;
  }

  setTimestamp(timestamp: number): void {
    this.context.mocks.set("timestamp", timestamp);
  }

  deployContract(abi: unknown[], bytecode: string, deployerIndex = 0, constructorArgs: unknown[] = []): TestContract {
    const address = `0x${(this.context.contracts.length + 1).toString(16).padStart(40, "0")}`;
    const contract: TestContract, abi, bytecode, label: `contract${this.context.contracts.length}` };
    this.context.contracts.push(contract);
    return contract;
  }

  getAccount(index = 0): TestAccount {
    return this.context.accounts[index] || this.context.accounts[0]!;
  }

  getAccounts(count = 5): TestAccount[] {
    return this.context.accounts.slice(0, count);
  }

  reset(): void {
    this.context = { chainId: this.context.chainId, rpcUrl: "http://localhost:8545", blockNumber: 18000000, accounts: this.generateTestAccounts(), contracts: [], mocks: new Map(), snapshots: [] };
    this.testResults = [];
  }

  assert(condition: boolean, message: string): TestResult {
    const result: TestResult = { passed: condition, message, timestamp: Date.now() };
    this.testResults.push(result);
    if (!condition) throw new Error(`Assertion failed: ${message}`);
    return result;
  }

  assertEqual<T>(actual: T, expected: T, message?: string): TestResult {
    const passed = actual === expected;
    return this.assert(passed, message || `Expected ${expected}, got ${actual}`);
  }

  assertApprox(actual: number, expected: number, tolerance = 0.01, message?: string): TestResult {
    const passed = Math.abs(actual - expected) <= tolerance;
    return this.assert(passed, message || `Expected ~${expected} (±${tolerance}), got ${actual}`);
  }

  assertBalance(address: string, expected: bigint, tolerance = 0n): TestResult {
    const account = this.context.accounts.find(a => a.address.toLowerCase() === address.toLowerCase());
    if (!account) return this.assert(false, `Account not found: ${address}`);
    const passed = account.balance >= expected - tolerance && account.balance <= expected + tolerance;
    this.testResults.push({ passed, message: `Balance for ${address}: expected ${expected}, got ${account.balance}`, timestamp: Date.now() });
    return this.testResults[this.testResults.length - 1]!;
  }

  getResults(): TestResult[] { return [...this.testResults]; }
  getSummary(): { total: number; passed: number; failed: number; passRate: number } {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.passed).length;
    return { total, passed, failed: total - passed, passRate: total > 0 ? passed / total : 0 };
  }

  forkUrl(chainId: ChainId): string {
    const urls: Record<number, string> = { 1: "https://eth.llamarpc.com", 56: "https://bsc-dataseed.binance.org", 137: "https://polygon-rpc.com", 42161: "https://arb1.arbitrum.io/rpc", 8453: "https://mainnet.base.org", 10: "https://mainnet.optimism.io" };
    return urls[chainId] || "http://localhost:8545";
  }
}

export interface TestResult { passed: boolean; message: string; timestamp: number }
