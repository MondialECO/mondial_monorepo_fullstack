import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BuyoutAgreementSigningScreen } from '@/components/marketplace/BuyoutAgreementSigningScreen';
import { BuyoutSigningPackage, FinalBuyoutSignedPackage } from '@/lib/api-marketplace-projects';
import marketplaceProjectsApi from '@/lib/api-marketplace-projects';

const mockBuyoutSigningPackage: BuyoutSigningPackage = {
  id: 'buyout_signing_pkg_1',
  dealId: 'deal_buyout_1',
  ideaId: 'idea_buyout_1',
  projectName: 'Autonomous Logistics Platform',
  dealType: 'FULL_BUYOUT',
  creatorId: 'creator_1',
  creatorName: 'Dr. Sarah Connor',
  entrepreneurId: 'ent_1',
  entrepreneurName: 'John Buyer',
  acceptedBuyoutRevisionNumber: 1,
  buyoutLegalPackageId: 'pkg_legal_1',
  buyoutLegalPackageVersion: 1,
  assetManifestVersion: 1,
  assetManifestHash: 'manifest_sha256_mock_hash_123',
  purchasePrice: 42000,
  currency: 'EUR',
  handoverPeriodWeeks: 3,
  transitionSupportWeeks: 4,
  includedAssets: ['Full IP Rights', 'Business Plan', 'Financial Forecast'],
  assetManifest: {
    dealId: 'deal_buyout_1',
    ideaId: 'idea_buyout_1',
    acceptedRevisionNumber: 1,
    purchasePrice: 42000,
    currency: 'EUR',
    handoverPeriodWeeks: 3,
    transitionSupportWeeks: 4,
    version: 1,
    manifestHash: 'manifest_sha256_mock_hash_123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assets: [
      {
        assetType: 'IP_RIGHTS',
        displayName: 'Full Intellectual Property & Concept Ownership',
        availabilityStatus: 'AVAILABLE_IN_PLATFORM',
        externalTransferRequired: false,
      },
      {
        assetType: 'DOMAIN',
        displayName: 'Domain Name & DNS Records',
        availabilityStatus: 'EXTERNAL_TRANSFER_REQUIRED',
        externalTransferRequired: true,
      },
    ],
  },
  documents: [
    {
      documentId: 'doc_apa_1',
      documentType: 'ASSET_PURCHASE_AGREEMENT',
      title: 'Asset Purchase Agreement (APA)',
      requirementType: 'REQUIRED',
      documentVersion: 1,
      documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      contentMarkdown: '# ASSET PURCHASE AGREEMENT\n\nPurchase Price: €42,000',
    },
    {
      documentId: 'doc_transfer_1',
      documentType: 'ASSET_TRANSFER_SCHEDULE',
      title: 'Asset Transfer Schedule',
      requirementType: 'REQUIRED',
      documentVersion: 1,
      documentHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      contentMarkdown: '# ASSET TRANSFER SCHEDULE\n\nAll verified assets.',
    },
  ],
  manifestHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  creatorSignature: null,
  entrepreneurSignature: null,
  assignedLegalProviderName: 'Global Tech Legal LLP',
  status: 'PENDING_SIGNATURES',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('FullBuyoutAgreementSigning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Full Buyout Agreement Signing screen with locked terms and parties', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockResolvedValue(mockBuyoutSigningPackage);

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="creator_1"
        isCreator={true}
      />
    );

    expect(await screen.findByRole('heading', { name: /Full Buyout Agreement Signing/i })).toBeInTheDocument();
    expect(screen.getByText('€42,000')).toBeInTheDocument();
    expect(screen.getByText(/Agreed Commercial Term 🔒/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Global Tech Legal LLP')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('John Buyer')).toBeInTheDocument();
  });

  it('renders Asset Scope from approved manifest', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockResolvedValue(mockBuyoutSigningPackage);

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="creator_1"
        isCreator={true}
      />
    );

    expect(await screen.findByText(/Assets Included in Sale/i)).toBeInTheDocument();
    expect(screen.getByText('Full Intellectual Property & Concept Ownership')).toBeInTheDocument();
    expect(screen.getByText('Domain Name & DNS Records')).toBeInTheDocument();
  });

  it('renders Documents checklist with SHA-256 fingerprint badges', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockResolvedValue(mockBuyoutSigningPackage);

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="creator_1"
        isCreator={true}
      />
    );

    expect(await screen.findByText('Asset Purchase Agreement (APA)')).toBeInTheDocument();
    expect(screen.getByText('Asset Transfer Schedule')).toBeInTheDocument();
    expect(screen.getAllByText(/Approved ✓/i).length).toBeGreaterThanOrEqual(2);
  });

  it('opens Document Viewer modal when View is clicked', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockResolvedValue(mockBuyoutSigningPackage);

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="creator_1"
        isCreator={true}
      />
    );

    const viewButtons = await screen.findAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);

    expect(screen.getByText(/Purchase Price: €42,000/i)).toBeInTheDocument();
  });

  it('disables sign button until consent checkbox is checked', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockResolvedValue(mockBuyoutSigningPackage);

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="creator_1"
        isCreator={true}
      />
    );

    const signButton = await screen.findByRole('button', { name: /sign buyout agreement/i });
    expect(signButton).toBeDisabled();

    const consentCheckbox = screen.getByRole('checkbox');
    expect(consentCheckbox).not.toBeChecked();

    fireEvent.click(consentCheckbox);
    expect(consentCheckbox).toBeChecked();
    expect(signButton).not.toBeDisabled();
  });

  it('executes signing and displays updated single-signed status', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockResolvedValue(mockBuyoutSigningPackage);

    const signedResponse: BuyoutSigningPackage = {
      ...mockBuyoutSigningPackage,
      status: 'CREATOR_SIGNED',
      creatorSignature: {
        signerUserId: 'creator_1',
        signerName: 'Dr. Sarah Connor',
        signerRole: 'Creator',
        manifestHash: mockBuyoutSigningPackage.manifestHash,
        legalPackageVersion: 1,
        signedAt: new Date().toISOString(),
        signatureHash: 'sha256_creator_sig_hash_123',
        consentStatement: 'I confirm that I reviewed and agree.',
      },
    };

    vi.spyOn(marketplaceProjectsApi, 'signBuyoutAgreement').mockResolvedValue(signedResponse);

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="creator_1"
        isCreator={true}
      />
    );

    const consentCheckbox = await screen.findByRole('checkbox');
    fireEvent.click(consentCheckbox);

    const signButton = screen.getByRole('button', { name: /sign buyout agreement/i });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(screen.getByText(/You have signed this Buyout Agreement/i)).toBeInTheDocument();
      expect(screen.getByText(/Waiting for the other party to complete execution/i)).toBeInTheDocument();
    });
  });

  it('executes bilateral signing and triggers onCompleted when both parties signed', async () => {
    const bothSignedPkg: BuyoutSigningPackage = {
      ...mockBuyoutSigningPackage,
      status: 'AGREEMENT_SIGNED',
      finalizedAt: new Date().toISOString(),
      creatorSignature: {
        signerUserId: 'creator_1',
        signerName: 'Dr. Sarah Connor',
        signerRole: 'Creator',
        manifestHash: mockBuyoutSigningPackage.manifestHash,
        legalPackageVersion: 1,
        signedAt: new Date().toISOString(),
        signatureHash: 'sha256_creator_sig_hash_123',
        consentStatement: 'I confirm that I reviewed and agree.',
      },
      entrepreneurSignature: {
        signerUserId: 'ent_1',
        signerName: 'John Buyer',
        signerRole: 'Entrepreneur',
        manifestHash: mockBuyoutSigningPackage.manifestHash,
        legalPackageVersion: 1,
        signedAt: new Date().toISOString(),
        signatureHash: 'sha256_buyer_sig_hash_123',
        consentStatement: 'I confirm that I reviewed and agree.',
      },
    };

    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockResolvedValue(mockBuyoutSigningPackage);
    vi.spyOn(marketplaceProjectsApi, 'signBuyoutAgreement').mockResolvedValue(bothSignedPkg);
    const onCompletedMock = vi.fn();

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="creator_1"
        isCreator={true}
        onCompleted={onCompletedMock}
      />
    );

    const consentCheckbox = await screen.findByRole('checkbox');
    fireEvent.click(consentCheckbox);

    const signButton = screen.getByRole('button', { name: /sign buyout agreement/i });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(screen.getByText(/Full Buyout Agreement Fully Executed/i)).toBeInTheDocument();
      expect(screen.getByText(/AGREEMENT SIGNED ✓/i)).toBeInTheDocument();
      expect(onCompletedMock).toHaveBeenCalledWith(bothSignedPkg);
    });
  });

  it('opens Request Legal Change modal and submits feedback', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockResolvedValue(mockBuyoutSigningPackage);
    const requestChangeSpy = vi.spyOn(marketplaceProjectsApi, 'requestBuyoutSigningLegalChange').mockResolvedValue({} as any);

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="creator_1"
        isCreator={true}
      />
    );

    const reqButton = await screen.findByRole('button', { name: /request legal change/i });
    fireEvent.click(reqButton);

    expect(screen.getByText(/Request Legal Wording Change/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Describe the requested legal wording modifications/i);
    fireEvent.change(textarea, { target: { value: 'Please update clause 4.1 on handover warranty.' } });

    const confirmButton = screen.getByRole('button', { name: /confirm & invalidate package/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(requestChangeSpy).toHaveBeenCalledWith('deal_buyout_1', {
        feedback: 'Please update clause 4.1 on handover warranty.',
        requestedChangeType: 'LEGAL_WORDING',
      });
    });
  });

  it('renders "Agreement Signing Not Available Yet" when backend returns stage error', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockRejectedValue({
      response: { data: { message: "Agreement Signing is not available in stage 'BUYOUT_TERMS_ACCEPTED'." } },
    });

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="creator_1"
        isCreator={true}
      />
    );

    expect(await screen.findByText(/Agreement Signing Not Available Yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Agreement Signing is not available in stage 'BUYOUT_TERMS_ACCEPTED'./i)).toBeInTheDocument();
    expect(screen.queryByText(/Cannot Access Buyout Signing/i)).not.toBeInTheDocument();
  });

  it('renders "You are not authorized to sign this agreement" when 403 forbidden', async () => {
    vi.spyOn(marketplaceProjectsApi, 'getBuyoutSigningPackage').mockRejectedValue({
      response: { data: { message: "Forbidden. Only Creator, Entrepreneur, or Assigned Legal Provider can access Buyout Signing." } },
    });

    render(
      <BuyoutAgreementSigningScreen
        dealId="deal_buyout_1"
        currentUserId="stranger_1"
        isCreator={false}
      />
    );

    expect(await screen.findByText(/You are not authorized to sign this agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/Forbidden. Only Creator, Entrepreneur/i)).toBeInTheDocument();
  });
});

