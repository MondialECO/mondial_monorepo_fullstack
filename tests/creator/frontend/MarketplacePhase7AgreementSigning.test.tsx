import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgreementSigningScreen } from '@/components/marketplace/AgreementSigningScreen';
import { AgreementSigningPackage, FinalAgreementPackage } from '@/lib/api-marketplace-projects';
import marketplaceProjectsApi from '@/lib/api-marketplace-projects';

const mockSigningPackage: AgreementSigningPackage = {
  id: 'signing_pkg_1',
  dealId: 'deal_123',
  ideaId: 'idea_123',
  projectName: 'Autonomous Supply Chain OS',
  creatorId: 'creator_1',
  creatorName: 'Dr. Alice Smith',
  entrepreneurId: 'ent_1',
  entrepreneurName: 'Bob Founder',
  legalPackageId: 'legal_pkg_1',
  legalPackageVersion: 1,
  acceptedOfferRevisionNumber: 1,
  roleAgreementVersion: 1,
  capTableVersion: 1,
  jurisdiction: 'Delaware, USA',
  companyContext: 'CASE_A_PRE_INCORPORATION',
  companyName: 'Venture Entity (To Be Formed)',
  documents: [
    {
      documentId: 'doc_cofounder_v1',
      documentType: 'COFOUNDER_AGREEMENT',
      title: 'Co-founder Partnership Agreement',
      requirementType: 'REQUIRED',
      documentVersion: 1,
      documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      contentMarkdown: '# CO-FOUNDER AGREEMENT\n\nParties agree to equity terms and roles.',
    },
    {
      documentId: 'doc_ip_v1',
      documentType: 'IP_CONTRIBUTION_AGREEMENT',
      title: 'IP Contribution Agreement',
      requirementType: 'REQUIRED',
      documentVersion: 1,
      documentHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      contentMarkdown: '# IP CONTRIBUTION AGREEMENT\n\nFull transfer of intellectual property.',
    },
    {
      documentId: 'doc_vesting_v1',
      documentType: 'VESTING_AGREEMENT',
      title: 'Restricted Stock Vesting Agreement',
      requirementType: 'REQUIRED',
      documentVersion: 1,
      documentHash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
      contentMarkdown: '# VESTING AGREEMENT\n\n48 months vesting with 12 months cliff.',
    },
  ],
  manifestHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  creatorSignature: null,
  entrepreneurSignature: null,
  status: 'PENDING_SIGNATURES',
  version: 1,
  commercialTerms: {
    equityPercentage: 20,
    creatorRole: 'Chief Technology Officer',
    cashComponent: 5000,
    vestingEnabled: true,
    vestingMonths: 48,
    cliffMonths: 12,
    acceptedRevisionNumber: 1,
  },
  assignedLegalProviderName: 'Attorney Smith, Esq.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('MarketplacePhase7AgreementSigning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Screen 05 Agreement Signing header, parties, and jurisdiction', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getSigningPackage').mockResolvedValue(mockSigningPackage);

    render(
      <AgreementSigningScreen
        dealId="deal_123"
        currentUserId="creator_1"
        userRole="Creator"
      />
    );

    expect(await screen.findByText('Agreement Signing')).toBeInTheDocument();
    expect(screen.getAllByText('Dr. Alice Smith').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Bob Founder').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Delaware, USA')).toBeInTheDocument();
    expect(screen.getByText(/Version V1/i)).toBeInTheDocument();
  });

  it('displays the package manifest SHA-256 fingerprint and document items', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getSigningPackage').mockResolvedValue(mockSigningPackage);

    render(
      <AgreementSigningScreen
        dealId="deal_123"
        currentUserId="creator_1"
        userRole="Creator"
      />
    );

    expect(await screen.findByText(/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08/i)).toBeInTheDocument();
    expect(screen.getByText('Co-founder Partnership Agreement')).toBeInTheDocument();
    expect(screen.getByText('IP Contribution Agreement')).toBeInTheDocument();
    expect(screen.getByText('Restricted Stock Vesting Agreement')).toBeInTheDocument();
  });

  it('displays legal provider verification badge with REVIEW_COMPLETE', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getSigningPackage').mockResolvedValue(mockSigningPackage);

    render(
      <AgreementSigningScreen
        dealId="deal_123"
        currentUserId="creator_1"
        userRole="Creator"
      />
    );

    expect(await screen.findByText('REVIEW_COMPLETE')).toBeInTheDocument();
    expect(screen.getByText(/Attorney Smith, Esq\./i)).toBeInTheDocument();
  });

  it('keeps "Sign Agreement" button disabled until consent checkbox is checked', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getSigningPackage').mockResolvedValue(mockSigningPackage);

    render(
      <AgreementSigningScreen
        dealId="deal_123"
        currentUserId="creator_1"
        userRole="Creator"
      />
    );

    const signBtn = await screen.findByTestId('sign-agreement-btn');
    expect(signBtn).toBeDisabled();

    const checkbox = screen.getByTestId('consent-checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(signBtn).not.toBeDisabled();
  });

  it('submits signature successfully and updates signing package state', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getSigningPackage').mockResolvedValue(mockSigningPackage);
    const signSpy = vi.spyOn(marketplaceProjectsApi, 'signAgreement').mockResolvedValue({
      ...mockSigningPackage,
      status: 'CREATOR_SIGNED',
      creatorSignature: {
        signerUserId: 'creator_1',
        signerName: 'Dr. Alice Smith',
        signerRole: 'Creator',
        manifestHash: mockSigningPackage.manifestHash,
        legalPackageVersion: 1,
        signedAt: new Date().toISOString(),
        signatureHash: 'abc123sig_hash',
        consentStatement: 'I confirm that I have reviewed and agree...',
      },
    });

    render(
      <AgreementSigningScreen
        dealId="deal_123"
        currentUserId="creator_1"
        userRole="Creator"
      />
    );

    const checkbox = await screen.findByTestId('consent-checkbox');
    fireEvent.click(checkbox);

    const signBtn = screen.getByTestId('sign-agreement-btn');
    fireEvent.click(signBtn);

    await waitFor(() => {
      expect(signSpy).toHaveBeenCalledWith('deal_123', expect.objectContaining({
        manifestHash: mockSigningPackage.manifestHash,
        legalPackageVersion: 1,
      }));
    });

    expect(await screen.findByText('Your Signature is Recorded')).toBeInTheDocument();
  });

  it('displays tamper-evident audit record platform notice', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getSigningPackage').mockResolvedValue(mockSigningPackage);

    render(
      <AgreementSigningScreen
        dealId="deal_123"
        currentUserId="creator_1"
        userRole="Creator"
      />
    );

    expect(await screen.findByText(/Platform electronic signature with tamper-evident audit record/i)).toBeInTheDocument();
  });

  it('opens and closes document preview modal', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getSigningPackage').mockResolvedValue(mockSigningPackage);

    render(
      <AgreementSigningScreen
        dealId="deal_123"
        currentUserId="creator_1"
        userRole="Creator"
      />
    );

    const viewBtns = await screen.findAllByText('View');
    fireEvent.click(viewBtns[0]);

    expect(await screen.findByText(/Parties agree to equity terms and roles/i)).toBeInTheDocument();

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Parties agree to equity terms and roles/i)).not.toBeInTheDocument();
    });
  });

  it('opens Request Legal Changes modal and submits feedback', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getSigningPackage').mockResolvedValue(mockSigningPackage);
    const changeSpy = vi.spyOn(marketplaceProjectsApi, 'requestSigningLegalChange').mockResolvedValue({
      ...mockSigningPackage,
      status: 'INVALIDATED',
    });

    render(
      <AgreementSigningScreen
        dealId="deal_123"
        currentUserId="creator_1"
        userRole="Creator"
      />
    );

    const requestBtn = await screen.findByText('Request Legal Changes');
    fireEvent.click(requestBtn);

    expect(screen.getByText('Request Legal Modifications')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Specify the terms, clauses, or details/i);
    fireEvent.change(textarea, { target: { value: 'Please update vesting acceleration clause.' } });

    const submitBtn = screen.getByText('Return to Legal Review');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(changeSpy).toHaveBeenCalledWith('deal_123', {
        feedback: 'Please update vesting acceleration clause.',
      });
    });
  });

  it('renders fully executed banner and allows viewing final signed package', async () => {
    const fullySignedPackage: AgreementSigningPackage = {
      ...mockSigningPackage,
      status: 'AGREEMENT_SIGNED',
      finalizedAt: new Date().toISOString(),
      creatorSignature: {
        signerUserId: 'creator_1',
        signerName: 'Dr. Alice Smith',
        signerRole: 'Creator',
        manifestHash: mockSigningPackage.manifestHash,
        legalPackageVersion: 1,
        signedAt: new Date().toISOString(),
        signatureHash: 'sig_creator_123',
      },
      entrepreneurSignature: {
        signerUserId: 'ent_1',
        signerName: 'Bob Founder',
        signerRole: 'Entrepreneur',
        manifestHash: mockSigningPackage.manifestHash,
        legalPackageVersion: 1,
        signedAt: new Date().toISOString(),
        signatureHash: 'sig_ent_123',
      },
    };

    const mockFinalPackage: FinalAgreementPackage = {
      dealId: 'deal_123',
      ideaId: 'idea_123',
      projectName: 'Autonomous Supply Chain OS',
      manifestHash: mockSigningPackage.manifestHash,
      legalPackageVersion: 1,
      documents: mockSigningPackage.documents,
      creatorSignature: fullySignedPackage.creatorSignature,
      entrepreneurSignature: fullySignedPackage.entrepreneurSignature,
      finalizedAt: fullySignedPackage.finalizedAt!,
      auditReference: 'deal_deal_123_signed_v1_9f86d081884c',
      status: 'AGREEMENT_SIGNED',
    };

    vi.spyOn(marketplaceProjectsApi, 'getSigningPackage').mockResolvedValue(fullySignedPackage);
    const finalSpy = vi.spyOn(marketplaceProjectsApi, 'getFinalSignedPackage').mockResolvedValue(mockFinalPackage);

    render(
      <AgreementSigningScreen
        dealId="deal_123"
        currentUserId="creator_1"
        userRole="Creator"
      />
    );

    expect(await screen.findByText('Agreement Fully Executed!')).toBeInTheDocument();
    expect(screen.getByText('FULLY SIGNED')).toBeInTheDocument();

    const viewFinalBtn = screen.getByText('View Final Package');
    fireEvent.click(viewFinalBtn);

    await waitFor(() => {
      expect(finalSpy).toHaveBeenCalledWith('deal_123');
    });

    expect(await screen.findByText('deal_deal_123_signed_v1_9f86d081884c')).toBeInTheDocument();
  });
});
