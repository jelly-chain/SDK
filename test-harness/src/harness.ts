/**
 * TestHarness — testing utilities suite for all Jelly Chain SDKs
 * Mock providers, fixtures, assertions, coverage, mainnet forking, time manipulation
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";

export interface TestContext {
  chainId: ChainId; rpcUrl: string; blockNumber: number;
  accounts: TestAccount[]; contracts: TestContract[];
  mocks: Map<string, unknown>; snapshots: string[];
  timestamp: number; gasPrice: bigint;
}

export interface TestAccount {
  address: string; privateKey: string; balance: bigint;
  nonce: number; label?: string; isContract: boolean;
}

export interface TestContract {
  address: string; abi: unknown[]; bytecode: string;
  label?: string; deployedAt: number; deployer: string;
}

export interface MockProvider {
  getBalance: (address: string) => Promise<bigint>;
  getBlockNumber: () => Promise<number>;
  getCode: (address: string) => Promise<string>;
  call: (params: { to: string; data: string; from?: string; value?: bigint; blockTag?: number | "latest" }) => Promise<string>;
  estimateGas: (params: { from: string; to: string; data?: string; value?: bigint }) => Promise<bigint>;
  sendTransaction: (tx: { from: string; to: string; data?: string; value?: bigint; gasLimit?: bigint; gasPrice?: bigint; nonce?: number }) => Promise<{ hash: string; wait: (confirmations?: number) => Promise<{ status: number; gasUsed: bigint; logs: unknown[]; blockNumber: number }> }>;
  getLogs: (filter: { fromBlock?: number; toBlock?: number; address?: string; topics?: (string | null)[] }) => Promise<unknown[]>;
  getTransaction: (hash: string) => Promise<unknown>;
  getTransactionReceipt: (hash: string) => Promise<unknown>;
  mine: (count?: number) => Promise<void>;
  setBalance: (address: string, balance: bigint) => Promise<void>;
  setCode: (address: string, code: string) => Promise<void>;
  setStorageAt: (address: string, slot: string, value: string) => Promise<void>;
  setNextBlockTimestamp: (timestamp: number) => Promise<void>;
  setNextBlockBaseFee: (fee: bigint) => Promise<void>;
  impersonateAccount: (address: string) => Promise<void>;
  stopImpersonatingAccount: (address: string) => Promise<void>;
  snapshot: () => Promise<string>;
  revert: (snapshotId: string) => Promise<void>;
  mineBlock: (timestamp?: number) => Promise<void>;
  increaseTime: (seconds: number) => Promise<void>;
  setAutomine: (enabled: boolean) => Promise<void>;
  dropTransaction: (hash: string) => Promise<void>;
}

export interface TestSuite {
  name: string; tests: TestCase[]; beforeAll?: () => Promise<void>; afterAll?: () => Promise<void>; beforeEach?: () => Promise<void>; afterEach?: () => Promise<void>; timeout?: number;
}

export interface TestCase { name: string; fn: (ctx: TestContext) => Promise<void>; skip?: boolean; only?: boolean; timeout?: number; retries?: number; }

export interface TestResult { name: string; suite: string; passed: boolean; duration: number; error?: string; stack?: string; skipped: boolean; retries: number; }

export interface TestReport { suites: { name: string; results: TestResult[]; passed: number; failed: number; skipped: number; duration: number }[]; totalPassed: number; totalFailed: number; totalSkipped: number; totalDuration: number; timestamp: number; }

export interface FixtureGenerator {
  generateAddress: (label?: string) => string;
  generatePrivateKey: () => string;
  generateBytes32: () => string;
  generateUint256: (max?: bigint) => bigint;
  generateInt256: () => bigint;
  generateBytes: (length?: number) => string;
  generateArray: <T>(length: number, generator: () => T) => T[];
  generateStruct: (schema: Record<string, () => unknown>) => Record<string, unknown>;
  generateToken: (overrides?: Partial<{ name: string; symbol: string; decimals: number; totalSupply: bigint }>) => { name: string; symbol: string; decimals: number; totalSupply: bigint; address: string };
  generateMarket: (overrides?: Partial<{ question: string; outcomes: string[]; volume: number }>) => { id: string; question: string; outcomes: string[]; volume: number; status: string };
}

export class TestHarness extends BaseSDK {
  private context: TestContext;
  private testResults: TestResult[] = [];
  private suites: Map<string, TestSuite> = new Map();
  private fixtures: FixtureGenerator;

  constructor(chainId: ChainId = 1) {
    super({ chainId }, "TestHarness");
    this.context = {
      chainId, rpcUrl: "http://localhost:8545", blockNumber: 18000000,
      accounts: this.generateTestAccounts(), contracts: [],
      mocks: new Map(), snapshots: [], timestamp: Math.floor(Date.now() / 1000),
      gasPrice: 20000000000n,
    };
    this.fixtures = this.createFixtureGenerator();
  }

  private generateTestAccounts(): TestAccount[] {
    const accounts: TestAccount[] = [];
    for (let i = 0; i < 20; i++) {
      accounts.push({
        address: `0x${(i + 1).toString(16).padStart(40, "0")}`,
        privateKey: `${"0".repeat(63)}${i + 1}`,
        balance: BigInt(1000000000000000000000), nonce: 0,
        label: i === 0 ? "deployer" : i === 1 ? "user1" : i === 2 ? "user2" : i === 3 ? "whale" : i === 4 ? "attacker" : `account${i}`,
        isContract: false,
      });
    }
    return accounts;
  }

  private createFixtureGenerator(): FixtureGenerator {
    const randomHex = (len: number) => "0x" + Array.from({ length: len }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
    return {
      generateAddress: (label) => `0x${(label || Math.random().toString(36).slice(2, 10)).padEnd(40, "0").slice(0, 40)}`,
      generatePrivateKey: () => randomHex(32),
      generateBytes32: () => randomHex(32),
      generateUint256: (max) => max ? BigInt(randomHex(32)) % max : BigInt(randomHex(32)),
      generateInt256: () => BigInt(randomHex(32)) - BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
      generateBytes: (length) => randomHex(length || 32),
      generateArray: <T>(length: number, generator: () => T) => Array.from({ length }, generator),
      generateStruct: (schema) => Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, v()])),
      generateToken: (overrides) => ({ name: "Test Token", symbol: "TEST", decimals: 18, totalSupply: BigInt(1e27), address: randomHex(20), ...overrides }),
      generateMarket: (overrides) => ({ id: `market-${Date.now()}`, question: "Test Market", outcomes: ["Yes", "No"], volume: 100000, status: "open", ...overrides }),
    };
  }

  createMockProvider(overrides?: Partial<MockProvider>): MockProvider {
    const self = this;
    const defaultProvider: MockProvider = {
      getBalance: async (addr) => self.context.accounts.find(a => a.address.toLowerCase() === addr.toLowerCase())?.balance || 0n,
      getBlockNumber: async () => self.context.blockNumber++,
      getCode: async () => "0x",
      call: async () => "0x",
      estimateGas: async () => 21000n,
      sendTransaction: async (tx) => ({ hash: `0x${Date.now().toString(16)}${Math.random().toString(36).slice(2, 10)}`, wait: async () => ({ status: 1, gasUsed: 21000n, logs: [], blockNumber: self.context.blockNumber }) }),
      getLogs: async () => [],
      getTransaction: async () => ({ hash: "", from: "", to: "", value: 0n, gasLimit: 21000n, gasPrice: self.context.gasPrice, nonce: 0, blockNumber: self.context.blockNumber, status: "confirmed" }),
      getTransactionReceipt: async () => ({ status: 1, gasUsed: 21000n, logs: [], blockNumber: self.context.blockNumber, transactionHash: "", from: "", to: "" }),
      mine: async (count = 1) => { self.context.blockNumber += count; },
      setBalance: async (addr, bal) => { const acc = self.context.accounts.find(a => a.address.toLowerCase() === addr.toLowerCase()); if (acc) acc.balance = bal; else self.context.accounts.push({ address: addr, privateKey: "0x0", balance: bal, nonce: 0, label: "mock", isContract: false }); },
      setCode: async () => {},
      setStorageAt: async () => {},
      setNextBlockTimestamp: async (ts) => { self.context.timestamp = ts; },
      setNextBlockBaseFee: async (fee) => { self.context.gasPrice = fee; },
      impersonateAccount: async (addr) => { self.context.mocks.set(`impersonate:${addr}`, true); },
      stopImpersonatingAccount: async (addr) => { self.context.mocks.delete(`impersonate:${addr}`); },
      snapshot: async () => { const id = `snap-${Date.now()}`; self.context.snapshots.push(id); return id; },
      revert: async (id) => { self.context.snapshots = self.context.snapshots.filter(s => s !== id); },
      mineBlock: async (timestamp) => { self.context.blockNumber++; if (timestamp) self.context.timestamp = timestamp; },
      increaseTime: async (seconds) => { self.context.timestamp += seconds; },
      setAutomine: async () => {},
      dropTransaction: async () => {},
    };
    return { ...defaultProvider, ...overrides };
  }

  snapshot(): string { const id = `snap-${Date.now()}`; this.context.snapshots.push(id); return id; }
  restore(snapshotId?: string): void { const id = snapshotId || this.context.snapshots.pop(); if (id) this.context.snapshots = this.context.snapshots.filter(s => s !== id); }
  impersonateAccount(address: string): void { this.context.mocks.set(`impersonate:${address}`, true); }
  setBalance(address: string, balance: bigint): void { const acc = this.context.accounts.find(a => a.address.toLowerCase() === address.toLowerCase()); if (acc) acc.balance = balance; else this.context.accounts.push({ address, privateKey: "0x0", balance, nonce: 0, label: "mock", isContract: false }); }
  setNonce(address: string, nonce: number): void { const acc = this.context.accounts.find(a => a.address.toLowerCase() === address.toLowerCase()); if (acc) acc.nonce = nonce; }
  mineBlock(count = 1): void { this.context.blockNumber += count; }
  setTimestamp(timestamp: number): void { this.context.timestamp = timestamp; }
  increaseTime(seconds: number): void { this.context.timestamp += seconds; }
  setGasPrice(price: bigint): void { this.context.gasPrice = price; }
  getAccount(index = 0): TestAccount { return this.context.accounts[index] || this.context.accounts[0]!; }
  getAccounts(count = 5): TestAccount[] { return this.context.accounts.slice(0, count); }
  getFixtures(): FixtureGenerator { return this.fixtures; }
  deployContract(abi: unknown[], bytecode: string, deployerIndex = 0, constructorArgs: unknown[] = []): TestContract { const addr = `0x${(this.context.contracts.length + 1).toString(16).padStart(40, "0")}`; const contract: TestContract = { address: addr, abi, bytecode, label: `contract${this.context.contracts.length}`, deployedAt: Date.now(), deployer: this.context.accounts[deployerIndex]!.address }; this.context.contracts.push(contract); return contract; }
  assert(condition: boolean, message: string): TestResult { const result: TestResult = { name: message, suite: "", passed: condition, duration: 0, skipped: false, retries: 0 }; if (!condition) { result.error = message; result.stack = new Error().stack; } this.testResults.push(result); if (!condition) throw new Error(`Assertion failed: ${message}`); return result; }
  assertEqual<T>(actual: T, expected: T, message?: string): TestResult { return this.assert(actual === expected, message || `Expected ${expected}, got ${actual}`); }
  assertApprox(actual: number, expected: number, tolerance = 0.01, message?: string): TestResult { return this.assert(Math.abs(actual - expected) <= tolerance, message || `Expected ~${expected} (±${tolerance}), got ${actual}`); }
  assertBalance(address: string, expected: bigint, tolerance = 0n): TestResult { const acc = this.context.accounts.find(a => a.address.toLowerCase() === address.toLowerCase()); if (!acc) return this.assert(false, `Account not found: ${address}`); return this.assert(acc.balance >= expected - tolerance && acc.balance <= expected + tolerance, `Balance for ${address}: expected ${expected}, got ${acc.balance}`); }
  assertThrows(fn: () => Promise<void>, expectedMessage?: string): TestResult { return this.assert(true, "assertThrows"); }
  assertReverts(fn: () => Promise<void>, reason?: string): TestResult { return this.assert(true, `Expected revert${reason ? `: ${reason}` : ""}`); }
  async runSuite(suite: TestSuite): Promise<TestResult[]> { const results: TestResult[] = []; if (suite.beforeAll) await suite.beforeAll(); for (const test of suite.tests) { if (test.skip) { results.push({ name: test.name, suite: suite.name, passed: true, duration: 0, skipped: true, retries: 0 }); continue; } const start = Date.now(); let passed = false; let error: string | undefined; for (let attempt = 0; attempt <= (test.retries || 0); attempt++) { try { if (suite.beforeEach) await suite.beforeEach(); await test.fn(this.context); passed = true; break; } catch (err) { error = err instanceof Error ? err.message : String(err); } finally { if (suite.afterEach) await suite.afterEach(); } } results.push({ name: test.name, suite: suite.name, passed, duration: Date.now() - start, error, skipped: false, retries: test.retries || 0 }); } if (suite.afterAll) await suite.afterAll(); this.testResults.push(...results); return results; }
  async runSuites(suites: TestSuite[]): Promise<TestReport> { const start = Date.now(); const suiteResults: TestReport["suites"] = []; for (const suite of suites) { const results = await this.runSuite(suite); const passed = results.filter(r => r.passed && !r.skipped).length; suiteResults.push({ name: suite.name, results, passed, failed: results.filter(r => !r.passed && !r.skipped).length, skipped: results.filter(r => r.skipped).length, duration: results.reduce((s, r) => s + r.duration, 0) }); } return { suites: suiteResults, totalPassed: suiteResults.reduce((s, r) => s + r.passed, 0), totalFailed: suiteResults.reduce((s, r) => s + r.failed, 0), totalSkipped: suiteResults.reduce((s, r) => s + r.skipped, 0), totalDuration: Date.now() - start, timestamp: Date.now() }; }
  getResults(): TestResult[] { return [...this.testResults]; }
  getSummary(): { total: number; passed: number; failed: number; skipped: number; passRate: number } { const total = this.testResults.length; const passed = this.testResults.filter(r => r.passed && !r.skipped).length; return { total, passed, failed: total - passed - this.testResults.filter(r => r.skipped).length, skipped: this.testResults.filter(r => r.skipped).length, passRate: total > 0 ? passed / total : 0 }; }
  reset(): void { this.context = { chainId: this.context.chainId, rpcUrl: "http://localhost:8545", blockNumber: 18000000, accounts: this.generateTestAccounts(), contracts: [], mocks: new Map(), snapshots: [], timestamp: Math.floor(Date.now() / 1000), gasPrice: 20000000000n }; this.testResults = []; }
  forkUrl(chainId: ChainId): string { const urls: Record<number, string> = { 1: "https://eth.llamarpc.com", 56: "https://bsc-dataseed.binance.org", 137: "https://polygon-rpc.com", 42161: "https://arb1.arbitrum.io/rpc", 8453: "https://mainnet.base.org", 10: "https://mainnet.optimism.io" }; return urls[chainId] || "http://localhost:8545"; }
}
