import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PartnershipActiveScreen } from '@/components/marketplace/PartnershipActiveScreen';
import marketplaceProjectsApi, {
  PartnershipActiveDetails,
  PartnershipMilestone
} from '@/lib/api-marketplace-projects';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/api-marketplace-projects', () => {
  return {
    default: {
      getMyPartnerships: vi.fn(),
      getPartnershipActiveDetails: vi.fn(),
      getPartnershipEquityDetails: vi.fn(),
      getPartnershipDocuments: vi.fn(),
      getPartnershipMilestones: vi.fn(),
      createPartnershipMilestone: vi.fn(),
      updatePartnershipMilestone: vi.fn()
    }
  };
});

const mockActivePartnershipDetails: PartnershipActiveDetails = {
  dealId: 'deal-phase9',
  ideaId: 'idea-phase9',
  projectName: 'Autonomous Logistics',
  outcomeBadge: 'CO-FOUNDED',
  status: 'PARTNERSHIP_ACTIVE',
  activatedAt: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
  creator: {
    userId: 'creator-phase9',
    displayName: 'Dr. Alice Creator',
    roleTitle: 'Chief Technology Officer',
    equityPercent: 15.0,
    shares: 1500000,
    isCreator: true
  },
  entrepreneur: {
    userId: 'ent-phase9',
    displayName: 'Bob Founder',
    roleTitle: 'Founder & CEO',
    equityPercent: 80.0,
    shares: 8000000,
    isCreator: false
  },
  company: {
    companyId: 'comp-phase9',
    companyName: 'Autonomous Logistics Inc.',
    legalStructure: 'Corporation',
    country: 'United States',
    jurisdiction: 'Delaware, USA',
    companyStatus: 'Active',
    corporateFilingStatus: 'FILING_COMPLETE',
    registrationNumber: 'DE-8839201',
    totalShares: 10000000,
    esopPoolPercent: 5.0,
    investorReservePercent: 0
  },
  equity: {
    dealId: 'deal-phase9',
    ideaId: 'idea-phase9',
    projectName: 'Autonomous Logistics',
    companyId: 'comp-phase9',
    companyName: 'Autonomous Logistics Inc.',
    legalStructure: 'Corporation',
    jurisdiction: 'Delaware, USA',
    totalShares: 10000000,
    currentOwnershipPercent: 15.0,
    sharesOwned: 1500000,
    shareClass: 'Common Shares',
    votingRights: 'Standard 1 vote per share',
    vestingEnabled: true,
    vestingMonths: 48,
    cliffMonths: 12,
    vestingStartDate: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
    vestedPercent: 3.75,
    vestedShares: 375000,
    unvestedPercent: 11.25,
    unvestedShares: 1125000,
    vestingStatusNotice: 'Vesting schedule active and on track.',
    shareholderStatus: 'Official Shareholder',
    capTableIntegrityStatus: 'VALID',
    companyDocuments: []
  },
  creatorRoleDetails: {
    roleTitle: 'Chief Technology Officer',
    responsibilities: [
      'Product Architecture',
      'Core Engine Development',
      'IP Roadmap'
    ],
    timeCommitment: 'Part-time (10 hrs/week)'
  },
  entrepreneurRoleDetails: {
    roleTitle: 'Founder & CEO',
    responsibilities: [
      'Operations',
      'Fundraising',
      'GTM Strategy'
    ],
    timeCommitment: 'Full-time'
  },
  documents: [
    {
      documentId: 'doc_cofounder_v1',
      documentType: 'COFOUNDER_AGREEMENT',
      title: 'Co-founder Agreement',
      version: 1,
      documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      linkedAt: new Date().toISOString()
    },
    {
      documentId: 'doc_ip_v1',
      documentType: 'IP_CONTRIBUTION_AGREEMENT',
      title: 'IP Contribution Agreement',
      version: 1,
      documentHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      linkedAt: new Date().toISOString()
    }
  ],
  milestones: [
    {
      id: 'ms-1',
      dealId: 'deal-phase9',
      ideaId: 'idea-phase9',
      companyId: 'comp-phase9',
      title: 'Initial Architecture & IP Handover',
      description: 'Hand over algorithm core codebase and documentation.',
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      status: 'IN_PROGRESS',
      createdByUserId: 'creator-phase9',
      createdByName: 'Dr. Alice Creator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  conversationId: 'conv-phase9',
  workspaceUrl: '/dashboard/creator/partnerships/deal-phase9',
  capTableIntegrityStatus: 'VALID'
};

describe('MarketplacePhase9PartnershipActive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Hero header with Partnership Active and CO-FOUNDED badge', async () => {
    vi.mocked(marketplaceProjectsApi.getPartnershipActiveDetails).mockResolvedValueOnce(mockActivePartnershipDetails);

    render(<PartnershipActiveScreen dealId="deal-phase9" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('🎉 Partnership Active')).toBeInTheDocument();
    });
    expect(screen.getByText('CO-FOUNDED')).toBeInTheDocument();
    expect(screen.queryByText('SOLD')).not.toBeInTheDocument();
  });

  it('renders Creator equity percentage and shares owned', async () => {
    vi.mocked(marketplaceProjectsApi.getPartnershipActiveDetails).mockResolvedValueOnce(mockActivePartnershipDetails);

    render(<PartnershipActiveScreen dealId="deal-phase9" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('🎉 Partnership Active')).toBeInTheDocument();
    });
    expect(screen.getAllByText('15%').length).toBeGreaterThan(0);
    expect(screen.getByText('1,500,000 Common Shares')).toBeInTheDocument();
    expect(screen.getByText('Official Shareholder')).toBeInTheDocument();
  });

  it('renders Vesting schedule with calculated percentages and notice', async () => {
    vi.mocked(marketplaceProjectsApi.getPartnershipActiveDetails).mockResolvedValueOnce(mockActivePartnershipDetails);

    render(<PartnershipActiveScreen dealId="deal-phase9" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Vesting schedule active and on track.')).toBeInTheDocument();
    });
    expect(screen.getByText(/48 mo. total • 12 mo. cliff/i)).toBeInTheDocument();
    expect(screen.getByText(/3.75%/i)).toBeInTheDocument();
  });

  it('renders fallback notice when vesting start date is pending', async () => {
    const pendingVestingDetails: PartnershipActiveDetails = {
      ...mockActivePartnershipDetails,
      equity: {
        ...mockActivePartnershipDetails.equity,
        vestingStartDate: null,
        vestedPercent: 0,
        vestedShares: 0,
        unvestedPercent: 15.0,
        unvestedShares: 1500000,
        vestingStatusNotice: 'Vesting schedule recorded — start date pending.'
      }
    };
    vi.mocked(marketplaceProjectsApi.getPartnershipActiveDetails).mockResolvedValueOnce(pendingVestingDetails);

    render(<PartnershipActiveScreen dealId="deal-phase9" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Vesting schedule recorded — start date pending.')).toBeInTheDocument();
    });
  });

  it('renders confirmed roles and responsibilities for Creator and Partner', async () => {
    vi.mocked(marketplaceProjectsApi.getPartnershipActiveDetails).mockResolvedValueOnce(mockActivePartnershipDetails);

    render(<PartnershipActiveScreen dealId="deal-phase9" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText(/Your Role: Chief Technology Officer/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Product Architecture')).toBeInTheDocument();
    expect(screen.getByText('IP Roadmap')).toBeInTheDocument();
    expect(screen.getByText(/Partner: Bob Founder/i)).toBeInTheDocument();
    expect(screen.getByText('Fundraising')).toBeInTheDocument();
  });

  it('renders signed documents with cryptographic verification', async () => {
    vi.mocked(marketplaceProjectsApi.getPartnershipActiveDetails).mockResolvedValueOnce(mockActivePartnershipDetails);

    render(<PartnershipActiveScreen dealId="deal-phase9" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Co-founder Agreement')).toBeInTheDocument();
    });
    expect(screen.getByText('IP Contribution Agreement')).toBeInTheDocument();
    expect(screen.getAllByText('✓ Signed & Linked').length).toBe(2);
  });

  it('displays venture milestones and allows marking a milestone complete', async () => {
    vi.mocked(marketplaceProjectsApi.getPartnershipActiveDetails).mockResolvedValueOnce(mockActivePartnershipDetails);
    vi.mocked(marketplaceProjectsApi.updatePartnershipMilestone).mockResolvedValueOnce({
      ...mockActivePartnershipDetails.milestones[0],
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    });

    render(<PartnershipActiveScreen dealId="deal-phase9" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Initial Architecture & IP Handover')).toBeInTheDocument();
    });

    const completeBtn = screen.getByText('Mark Complete');
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(marketplaceProjectsApi.updatePartnershipMilestone).toHaveBeenCalledWith(
        'deal-phase9',
        'ms-1',
        { status: 'COMPLETED' }
      );
    });
  });

  it('renders Add Milestone modal and handles milestone creation', async () => {
    vi.mocked(marketplaceProjectsApi.getPartnershipActiveDetails).mockResolvedValueOnce(mockActivePartnershipDetails);
    vi.mocked(marketplaceProjectsApi.createPartnershipMilestone).mockResolvedValueOnce({
      id: 'ms-2',
      dealId: 'deal-phase9',
      ideaId: 'idea-phase9',
      companyId: 'comp-phase9',
      title: 'MVP Launch',
      description: 'Deploy production v1.',
      status: 'NOT_STARTED',
      createdByUserId: 'creator-phase9',
      createdByName: 'Dr. Alice Creator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    render(<PartnershipActiveScreen dealId="deal-phase9" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Add Milestone')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Milestone'));

    expect(screen.getByText('Create Venture Milestone')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText('e.g., MVP Alpha Launch');
    fireEvent.change(titleInput, { target: { value: 'MVP Launch' } });

    const submitBtn = screen.getByRole('button', { name: 'Create Milestone' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(marketplaceProjectsApi.createPartnershipMilestone).toHaveBeenCalledWith(
        'deal-phase9',
        expect.objectContaining({ title: 'MVP Launch' })
      );
    });
  });

  it('displays cap table reconciliation warning if mismatch is flagged', async () => {
    const mismatchedDetails: PartnershipActiveDetails = {
      ...mockActivePartnershipDetails,
      capTableIntegrityStatus: 'OWNERSHIP_RECONCILIATION_REQUIRED'
    };
    vi.mocked(marketplaceProjectsApi.getPartnershipActiveDetails).mockResolvedValueOnce(mismatchedDetails);

    render(<PartnershipActiveScreen dealId="deal-phase9" isCreator={true} />);

    await waitFor(() => {
      expect(screen.getByText('Cap Table Reconciliation Notice')).toBeInTheDocument();
    });
    expect(screen.getByText(/An ownership mismatch was detected/i)).toBeInTheDocument();
  });
});
