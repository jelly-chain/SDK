import { describe, it, expect } from 'vitest';
import { WorldSportsSDK } from '../src/sdk.js';

describe('WorldSportsSDK', () => {
  it('initializes with no config', () => {
    const sdk = new WorldSportsSDK();
    expect(sdk).toBeInstanceOf(WorldSportsSDK);
  });

  it('exposes all required namespaces', () => {
    const sdk = new WorldSportsSDK();
    expect(sdk.sports).toBeDefined();
    expect(sdk.intelligence).toBeDefined();
    expect(sdk.prediction).toBeDefined();
    expect(sdk.markets).toBeDefined();
    expect(sdk.agents).toBeDefined();
    expect(sdk.tools).toBeDefined();
    expect(sdk.backtesting).toBeDefined();
  });

  it('sports namespace has all sub-modules', () => {
    const sdk = new WorldSportsSDK();
    expect(sdk.sports.fixtures).toBeDefined();
    expect(sdk.sports.teams).toBeDefined();
    expect(sdk.sports.leagues).toBeDefined();
    expect(sdk.sports.standings).toBeDefined();
    expect(sdk.sports.players).toBeDefined();
    expect(sdk.sports.venues).toBeDefined();
    expect(sdk.sports.bracket).toBeDefined();
    expect(sdk.sports.events).toBeDefined();
    expect(sdk.sports.results).toBeDefined();
    expect(sdk.sports.history).toBeDefined();
  });

  it('intelligence namespace has all sub-modules', () => {
    const sdk = new WorldSportsSDK();
    expect(sdk.intelligence.form).toBeDefined();
    expect(sdk.intelligence.matchup).toBeDefined();
    expect(sdk.intelligence.injuries).toBeDefined();
    expect(sdk.intelligence.squadStrength).toBeDefined();
    expect(sdk.intelligence.schedulePressure).toBeDefined();
    expect(sdk.intelligence.upsets).toBeDefined();
    expect(sdk.intelligence.narratives).toBeDefined();
    expect(sdk.intelligence.availability).toBeDefined();
    expect(sdk.intelligence.leagueContext).toBeDefined();
  });

  it('prediction namespace has all sub-modules', () => {
    const sdk = new WorldSportsSDK();
    expect(sdk.prediction.parser).toBeDefined();
    expect(sdk.prediction.features).toBeDefined();
    expect(sdk.prediction.resolution).toBeDefined();
    expect(sdk.prediction.confidence).toBeDefined();
    expect(sdk.prediction.scenarios).toBeDefined();
    expect(sdk.prediction.calibrator).toBeDefined();
    expect(sdk.prediction.explanation).toBeDefined();
  });

  it('returns tool definitions from getToolDefinitions()', () => {
    const sdk = new WorldSportsSDK();
    const defs = sdk.getToolDefinitions();
    expect(Array.isArray(defs)).toBe(true);
    expect(defs.length).toBe(4);
  });

  it('tool definitions have correct shape', () => {
    const sdk = new WorldSportsSDK();
    const defs = sdk.getToolDefinitions();
    for (const def of defs) {
      expect(typeof def.name).toBe('string');
      expect(typeof def.description).toBe('string');
      expect(def.input_schema.type).toBe('object');
      expect(typeof def.input_schema.properties).toBe('object');
    }
  });

  it('markets namespace is present', () => {
    const sdk = new WorldSportsSDK();
    expect(sdk.markets.polymarket).toBeDefined();
    expect(sdk.markets.kalshi).toBeDefined();
    expect(sdk.markets.common).toBeDefined();
  });

  it('accepts custom cache TTL', () => {
    const sdk = new WorldSportsSDK({ cache: { ttlSeconds: 60 } });
    expect(sdk).toBeInstanceOf(WorldSportsSDK);
  });
});
