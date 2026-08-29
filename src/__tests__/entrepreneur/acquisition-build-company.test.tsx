import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { validateOwnershipSplit, LEGAL_STRUCTURE_TYPES } from '@/components/company-formation/CompanyPlanningCard';
import { validateUseOfFunds } from '@/components/company-formation/FundingPreparationCard';

describe('Acquisition Build Company — Planning & Validation', () => {
  it('validateOwnershipSplit calculates 100% split and founder totals correctly', () => {
    const validSplit = [
      { holder: 'Buyer (You)', percent: 80, isFounder: true, isEsop: false },
      { holder: 'ESOP Pool', percent: 15, isFounder: false, isEsop: true },
      { holder: 'Advisor', percent: 5, isFounder: false, isEsop: false },
    ];

    const result = validateOwnershipSplit(validSplit);
    expect(result.isValid).toBe(true);
    expect(result.total).toBe(100);
    expect(result.founderTotal).toBe(80);
    expect(result.esopTotal).toBe(15);
    expect(result.hasEsopWarning).toBe(false);
  });

  it('validateOwnershipSplit flags invalid sum (< 100 or > 100)', () => {
    const invalidSplit = [
      { holder: 'Buyer (You)', percent: 70, isFounder: true, isEsop: false },
      { holder: 'Advisor', percent: 10, isFounder: false, isEsop: false },
    ];

    const result = validateOwnershipSplit(invalidSplit);
    expect(result.isValid).toBe(false);
    expect(result.total).toBe(80);
    expect(result.hasEsopWarning).toBe(true);
  });

  it('validateUseOfFunds calculates 100% allocation correctly', () => {
    const validUse = [
      { category: 'Engineering', percent: 60 },
      { category: 'Marketing', percent: 25 },
      { category: 'Legal & Operations', percent: 15 },
    ];

    const result = validateUseOfFunds(validUse);
    expect(result.isValid).toBe(true);
    expect(result.total).toBe(100);
  });

  it('LEGAL_STRUCTURE_TYPES contains SAS, SAS-U, and SARL', () => {
    expect(LEGAL_STRUCTURE_TYPES).toContain('SAS');
    expect(LEGAL_STRUCTURE_TYPES).toContain('SAS-U');
    expect(LEGAL_STRUCTURE_TYPES).toContain('SARL');
  });
});
