import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CompanyActivationScreen } from '@/components/marketplace/CompanyActivationScreen';
import marketplaceProjectsApi, {
  PartnershipActivation
} from '@/lib/api-marketplace-projects';

vi.mock('@/lib/api-marketplace-projects', () => {
  return {
    default: {
      getDealActivation: vi.fn(),
      startDealActivation: vi.fn(),
      completeDealActivation: vi.fn(),
      updateCorporateFilingStatus: vi.fn()
    }
  };
});

const mockActivationPending: PartnershipActivation = {
  id: 'act-1',
  dealId: 'deal-1',
  ideaId: 'idea-1',
  projectName: 'Autonomous AI Supply Chain',
  creatorId: 'creator-1',
  creatorName: 'Dr. Alice Creator',
  entrepreneurId: 'ent-1',
  entrepreneurName: 'Bob Founder',
  companyId: null,
  companyName: 'Autonomous AI Supply Chain Inc.',
  companyCase: 'CASE_A_PRE_INCORPORATION',
  status: 'ACTIVATION_PENDING',
  signedManifestHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  appliedLegalPackageVersion: 1,
  appliedOfferRevisionNumber: 1,
  appliedRoleAgreementVersion: 1,
  appliedCapTableVersion: 1,
  creatorShareholderId: null,
  entrepreneurShareholderId: null,
  corporateFilingStatus: 'NOT_REQUIRED',
  corporateFilingNotes: null,
  canActivate: false,
  blockers: ['Company workspace setup has not been initialized.'],
  linkedDocuments: [],
  ownershipComparison: {
    entries: [
      {
        userId: 'ent-1',
        displayName: 'Bob Founder',
        roleTitle: 'Founder & CEO',
        type: 'founder',
        previousEquityPercent: 100,
        signedEquityPercent: 80,
        previousShares: 10000000,
        signedShares: 8000000,
        vestingMonths: 0,
        cliffMonths: 0,
        isCreator: false,
        isFounder: true
      },
      {
        userId: 'creator-1',
        displayName: 'Dr. Alice Creator',
        roleTitle: 'Chief Scientist',
        type: 'founder',
        previousEquityPercent: 0,
        signedEquityPercent: 15,
        previousShares: 0,
        signedShares: 1500000,
        vestingMonths: 48,
        cliffMonths: 12,
        isCreator: true,
        isFounder: false
      }
    ],
    esopPoolPercent: 5,
    investorReservePercent: 0,
    totalShares: 10000000,
    notice: 'Platform ownership record'
  },
  commercialTerms: {
    equityPercentage: 15,
    creatorRole: 'Chief Scientist',
    cashComponent: null,
    vestingEnabled: true,
    vestingMonths: 48,
    cliffMonths: 12,
    acceptedRevisionNumber: 1
  },
  version: 1,
  createdAt: '2026-08-27T08:00:00Z',
  updatedAt: '2026-08-27T08:00:00Z'
};

const mockReadyToActivate: PartnershipActivation = {
  ...mockActivationPending,
  companyId: 'comp-1',
  status: 'READY_TO_ACTIVATE',
  canActivate: true,
  blockers: [],
  linkedDocuments: [
    {
      documentId: 'doc_cofounder_v1',
      documentType: 'COFOUNDER_AGREEMENT',
      title: 'Co-founder Agreement',
      version: 1,
      documentHash: 'hash_cofounder_sha256',
      linkedAt: '2026-08-27T08:15:00Z'
    },
    {
      documentId: 'doc_ip_v1',
      documentType: 'IP_CONTRIBUTION_AGREEMENT',
      title: 'IP Contribution Agreement',
      version: 1,
      documentHash: 'hash_ip_sha256',
      linkedAt: '2026-08-27T08:15:00Z'
    }
  ]
};

const mockActivated: PartnershipActivation = {
  ...mockReadyToActivate,
  status: 'PARTNERSHIP_ACTIVE',
  completedAt: '2026-08-27T08:30:00Z'
};

describe('Screen 06 — Company & Project Activation Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renders Screen 06 header and invariant checklist', async () => {
    vi.mocked(marketplaceProjectsApi.getDealActivation).mockResolvedValueOnce(mockActivationPending);

    render(<CompanyActivationScreen dealId="deal-1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Company & Project Activation')).toBeInTheDocument();
    });

    expect(screen.getByText('Activation Invariants')).toBeInTheDocument();
    expect(screen.getByText('Commercial Terms Accepted')).toBeInTheDocument();
    expect(screen.getByText('Roles Bilaterally Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Cap Table Approved')).toBeInTheDocument();
    expect(screen.getByText('Dual-Party Agreement Signed')).toBeInTheDocument();
  });

  it('2. Displays Case A pre-incorporation context and allows entering company name', async () => {
    vi.mocked(marketplaceProjectsApi.getDealActivation).mockResolvedValueOnce(mockActivationPending);

    render(<CompanyActivationScreen dealId="deal-1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText(/Case A: Pre-incorporation Platform Workspace/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('e.g., Autonomous AI Supply Chain Inc.')).toBeInTheDocument();
  });

  it('3. Displays Before & After Ownership Comparison table accurately', async () => {
    vi.mocked(marketplaceProjectsApi.getDealActivation).mockResolvedValueOnce(mockActivationPending);

    render(<CompanyActivationScreen dealId="deal-1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Before & After Ownership Comparison')).toBeInTheDocument();
    });

    expect(screen.getByText('Dr. Alice Creator')).toBeInTheDocument();
    expect(screen.getByText('Bob Founder')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('ESOP Option Pool')).toBeInTheDocument();
  });

  it('4. Shows blockers when canActivate is false and keeps Activate Partnership disabled', async () => {
    vi.mocked(marketplaceProjectsApi.getDealActivation).mockResolvedValueOnce(mockActivationPending);

    render(<CompanyActivationScreen dealId="deal-1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Activation Blockers Remaining:')).toBeInTheDocument();
    });

    expect(screen.getByText('Company workspace setup has not been initialized.')).toBeInTheDocument();

    const activateBtn = screen.getByRole('button', { name: /Activate Partnership/i });
    expect(activateBtn).toBeDisabled();
  });

  it('5. Calls startDealActivation when Initialize Company Setup is clicked', async () => {
    vi.mocked(marketplaceProjectsApi.getDealActivation).mockResolvedValueOnce(mockActivationPending);
    vi.mocked(marketplaceProjectsApi.startDealActivation).mockResolvedValueOnce(mockReadyToActivate);

    render(<CompanyActivationScreen dealId="deal-1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Initialize Company Setup/i })).toBeInTheDocument();
    });

    const initBtn = screen.getByRole('button', { name: /Initialize Company Setup/i });
    fireEvent.click(initBtn);

    await waitFor(() => {
      expect(marketplaceProjectsApi.startDealActivation).toHaveBeenCalledWith('deal-1', {
        companyName: 'Autonomous AI Supply Chain Inc.'
      });
    });
  });

  it('6. Displays Linked Corporate Documents with SHA-256 hashes', async () => {
    vi.mocked(marketplaceProjectsApi.getDealActivation).mockResolvedValueOnce(mockReadyToActivate);

    render(<CompanyActivationScreen dealId="deal-1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Linked Corporate Documents')).toBeInTheDocument();
    });

    expect(screen.getByText('Co-founder Agreement')).toBeInTheDocument();
    expect(screen.getByText('IP Contribution Agreement')).toBeInTheDocument();
    expect(screen.getByText(/SHA-256: hash_cofounder_sha256/i)).toBeInTheDocument();
  });

  it('7. Calls completeDealActivation when Activate Partnership is enabled and clicked', async () => {
    vi.mocked(marketplaceProjectsApi.getDealActivation).mockResolvedValueOnce(mockReadyToActivate);
    vi.mocked(marketplaceProjectsApi.completeDealActivation).mockResolvedValueOnce(mockActivated);

    const onCompleteMock = vi.fn();

    render(
      <CompanyActivationScreen
        dealId="deal-1"
        isCreator={true}
        onActivationComplete={onCompleteMock}
      />
    );

    await waitFor(() => {
      const activateBtn = screen.getByRole('button', { name: /Activate Partnership/i });
      expect(activateBtn).not.toBeDisabled();
    });

    const activateBtn = screen.getByRole('button', { name: /Activate Partnership/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(marketplaceProjectsApi.completeDealActivation).toHaveBeenCalledWith('deal-1');
      expect(onCompleteMock).toHaveBeenCalledWith(mockActivated);
    });
  });

  it('8. Displays PROJECT CO-FOUNDED celebration banner when active', async () => {
    vi.mocked(marketplaceProjectsApi.getDealActivation).mockResolvedValueOnce(mockActivated);

    render(<CompanyActivationScreen dealId="deal-1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Partnership Successfully Activated!')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/CO-FOUNDED/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Marketplace listing closed to other buyers/i)).toBeInTheDocument();
  });

  it('9. Corporate filing modal allows updating filing state', async () => {
    vi.mocked(marketplaceProjectsApi.getDealActivation).mockResolvedValueOnce(mockReadyToActivate);
    vi.mocked(marketplaceProjectsApi.updateCorporateFilingStatus).mockResolvedValueOnce({
      ...mockReadyToActivate,
      corporateFilingStatus: 'FILING_COMPLETE'
    });

    render(<CompanyActivationScreen dealId="deal-1" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(screen.getByText('Update Corporate Filing Status')).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(marketplaceProjectsApi.updateCorporateFilingStatus).toHaveBeenCalledWith('deal-1', {
        filingStatus: 'FILING_COMPLETE',
        notes: undefined
      });
    });
  });
});
