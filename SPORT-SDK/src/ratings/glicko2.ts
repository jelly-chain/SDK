import { League } from '../types.js';

export interface Glicko2Rating {
  mu: number; // rating
  sigma: number; // rating deviation
  omega: number; // volatility
}

export interface Glicko2Match {
  league: League;
  homeRating: Glicko2Rating;
  awayRating: Glicko2Rating;
  homeScore: number;
  awayScore: number;
  // Optional days since match for dynamic RD/volatility
  daysAgo?: number;
}

function expectedScore(muA: number, muB: number): number {
  return 1 / (1 + Math.exp((muB - muA) / 400));
}

function toGlicko2Mu(rating: number): number {
  // Standard transform: mu = (r - 1500) / 173.7178
  return (rating - 1500) / 173.7178;
}

function fromGlicko2Mu(mu: number): number {
  return mu * 173.7178 + 1500;
}

function toGlicko2Phi(sigma: number): number {
  // Standard RD transform: phi = sigma / 173.7178
  return sigma / 173.7178;
}

function fromGlicko2Phi(phi: number): number {
  return phi * 173.7178;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Calculate glicko-2 update values.
 *
 * Uses a simplified but numerically stable glicko-2 style update.
 */
export function calculateGlicko2(match: Glicko2Match): {
  homeExpected: number;
  awayExpected: number;
  homeActual: 1 | 0.5 | 0;
  awayActual: 1 | 0.5 | 0;
} {
  const { homeRating, awayRating, homeScore, awayScore } = match;

  const homeActual: 1 | 0.5 | 0 = homeScore > awayScore ? 1 : homeScore === awayScore ? 0.5 : 0;
  const awayActual: 1 | 0.5 | 0 = homeActual === 1 ? 0 : homeActual === 0 ? 1 : 0.5;

  const homeExpected = expectedScore(homeRating.mu, awayRating.mu);
  const awayExpected = expectedScore(awayRating.mu, homeRating.mu);

  return { homeExpected, awayExpected, homeActual, awayActual };
}

export function qualityOfWin(params: {
  muWinner: number;
  sigmaWinner: number;
  muLoser: number;
  sigmaLoser: number;
}): number {
  // Conventional quality: smaller combined uncertainty => higher quality.
  const phiW = toGlicko2Phi(params.sigmaWinner);
  const phiL = toGlicko2Phi(params.sigmaLoser);
  const d2 = 1 / (1 + (phiW * phiW) / 1); // placeholder scaling
  const d3 = 1 / (1 + (phiL * phiL) / 1);
  const q = d2 * d3;
  return clamp(q, 0, 1);
}

export function updateRatings(match: Glicko2Match): { homeUpdated: Glicko2Rating; awayUpdated: Glicko2Rating } {
  const { homeRating, awayRating, homeScore, awayScore } = match;

  // Use simplified glicko-2 update (mu/sigma/omega)
  const { homeExpected, awayExpected, homeActual, awayActual } = calculateGlicko2(match);

  // Constants
  const tau = 0.5;
  const eps = 0.000001;

  const sigmaToPhi = (sigma: number) => toGlicko2Phi(sigma);

  const phiH = sigmaToPhi(homeRating.sigma);
  const phiA = sigmaToPhi(awayRating.sigma);

  const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  const e = (mu: number, muOpp: number, phiOpp: number) => 1 / (1 + Math.exp(-g(phiOpp) * ((mu - muOpp))));

  const muH = toGlicko2Mu(homeRating.mu);
  const muA = toGlicko2Mu(awayRating.mu);

  const gH = g(phiA);
  const gA = g(phiH);

  const eH = e(muH, muA, phiA);
  const eA = e(muA, muH, phiH);

  const v = 1 / (gH * gH * eH * (1 - eH) + eps);
  const deltaH = v * gH * (homeActual - eH);
  const deltaA = v * gA * (awayActual - eA);

  // Volatility update (iterative method simplified)
  const updateSigma = (sigma: number, delta: number, phi: number) => {
    // Work in log(sigma^2)
    const sigma2 = sigma * sigma;
    const a = Math.log(sigma2);

    // Objective function
    const f = (x: number) => {
      const ex = Math.exp(x);
      const num = ex * (delta * delta - phi * phi - v - ex);
      const den = 2 * (phi * phi + v + ex) * (phi * phi + v + ex);
      return num / den - (x - a) / (tau * tau);
    };

    let A = a;
    let B = 0;
    if (delta * delta > phi * phi + v) {
      B = Math.log(delta * delta - phi * phi - v);
    } else {
      let k = 1;
      while (f(a - k * tau) < 0) k += 1;
      B = a - k * tau;
    }

    let fA = f(A);
    let fB = f(B);
    let iter = 0;
    while (Math.abs(B - A) > eps && iter < 50) {
      const C = A + (A - B) * fA / (fB - fA);
      const fC = f(C);
      if (fC * fB < 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA * fB / (fC + eps);
      }
      B = C;
      fB = fC;
      iter += 1;
    }

    const x = (A + B) / 2;
    const newSigma = Math.sqrt(Math.exp(x));
    return clamp(newSigma, 0.0001, 1000);
  };

  const newSigmaH = updateSigma(homeRating.sigma, deltaH, phiH);
  const newSigmaA = updateSigma(awayRating.sigma, deltaA, phiA);

  const phiHStar = Math.sqrt(phiH * phiH + newSigmaH * newSigmaH);
  const phiAStar = Math.sqrt(phiA * phiA + newSigmaA * newSigmaA);

  const phiHNew = 1 / Math.sqrt((1 / (phiHStar * phiHStar + eps)) + (1 / v) );
  const phiANew = 1 / Math.sqrt((1 / (phiAStar * phiAStar + eps)) + (1 / v) );

  const muHNew = muH + (phiHStar * phiHStar) * gH * (homeActual - eH) / (v + eps);
  const muANew = muA + (phiAStar * phiAStar) * gA * (awayActual - eA) / (v + eps);

  return {
    homeUpdated: {
      mu: fromGlicko2Mu(muHNew),
      sigma: fromGlicko2Phi(phiHNew),
      omega: newSigmaH,
    },
    awayUpdated: {
      mu: fromGlicko2Mu(muANew),
      sigma: fromGlicko2Phi(phiANew),
      omega: newSigmaA,
    },
  };
}
