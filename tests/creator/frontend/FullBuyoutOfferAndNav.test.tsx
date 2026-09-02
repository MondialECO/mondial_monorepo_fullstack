import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BuyoutOfferForm } from '@/components/marketplace/BuyoutOfferForm';
import { BuyoutOfferReviewModal } from '@/components/marketplace/BuyoutOfferReviewModal';
import { menu } from '@/lib/menu';
import { UserRole } from '@/lib/roles';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('Creator Canonical Navigation Menu — Final Product-Journey Reorganization', () => {
  it('contains the canonical menu sections with exact items and routes in product-journey order', () => {
    const creatorMenu = menu[UserRole.CREATOR];
    expect(creatorMenu).toBeDefined();
    expect(creatorMenu.length).toBe(6);

    // 1. DASHBOARD
    expect(creatorMenu[0].title).toBe('Dashboard');
    expect(creatorMenu[0].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Overview', href: '/dashboard/creator' },
      { label: 'My Ideas', href: '/dashboard/creator/myideas' },
    ]);

    // 2. PROJECT BUILDER
    expect(creatorMenu[1].title).toBe('Project Builder');
    expect(creatorMenu[1].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Project Studio', href: '/dashboard/creator/project-studio' },
      { label: 'Pricing & Equity', href: '/dashboard/creator/offer-pricing' },
      { label: 'Growth & Readiness', href: '/dashboard/creator/investors' },
    ]);

    // 3. PROJECT MARKETPLACE
    expect(creatorMenu[2].title).toBe('Project Marketplace');
    expect(creatorMenu[2].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Project Marketplace', href: '/dashboard/creator/marketplace' },
      { label: 'Launch to Market', href: '/dashboard/creator/crossroads' },
      { label: 'Partnerships', href: '/dashboard/creator/partnerships' },
      { label: 'Project Sales', href: '/dashboard/creator/sales' },
    ]);

    // 4. ASSETS & IP
    expect(creatorMenu[3].title).toBe('Assets & IP');
    expect(creatorMenu[3].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Documents', href: '/dashboard/creator/documents' },
      { label: 'Asset Library', href: '/dashboard/creator/asset-library' },
      { label: 'IP Vault', href: '/dashboard/creator/ip-vault' },
    ]);

    // 5. SERVICES & NETWORK
    expect(creatorMenu[4].title).toBe('Services & Network');
    expect(creatorMenu[4].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Hire Services', href: '/marketplace/services' },
      { label: 'Active Engagements', href: '/dashboard/creator/engagements' },
    ]);

    // 6. COMMUNICATION & ACCOUNT
    expect(creatorMenu[5].title).toBe('Communication & Account');
    expect(creatorMenu[5].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Messages', href: '/dashboard/creator/messages' },
      { label: 'Notifications', href: '/dashboard/creator/notifications' },
      { label: 'Profile', href: '/dashboard/profile' },
      { label: 'Settings', href: '/dashboard/creator/settings' },
    ]);
    const labels = creatorMenu.flatMap((s) => s.items).map((i) => i.label);
    expect(labels).not.toContain('Sold Projects');
    expect(labels).not.toContain('The Crossroads');
    expect(labels).not.toContain('Sell Idea');
    expect(labels).not.toContain('Sell Project');
  });

  it('correctly calculates active state for parent and child routes in AppSidebar logic', () => {
    const isDashboardRoot = (href: string) =>
      href === '/dashboard/creator' ||
      href === '/dashboard/investor' ||
      href === '/dashboard/entrepreneur' ||
      href === '/dashboard/serviceprovider' ||
      href === '/dashboard/admin';

    const isActive = (itemHref: string, pathname: string) =>
      pathname === itemHref || (!isDashboardRoot(itemHref) && pathname.startsWith(itemHref + '/'));

    // Exact matches
    expect(isActive('/dashboard/creator', '/dashboard/creator')).toBe(true);
    expect(isActive('/dashboard/creator/crossroads', '/dashboard/creator/crossroads')).toBe(true);
    expect(isActive('/dashboard/creator/partnerships', '/dashboard/creator/partnerships')).toBe(true);
    expect(isActive('/dashboard/creator/investors', '/dashboard/creator/investors')).toBe(true);
    expect(isActive('/dashboard/creator/offer-pricing', '/dashboard/creator/offer-pricing')).toBe(true);

    // Child route matches (e.g. partnership deal detail)
    expect(isActive('/dashboard/creator/partnerships', '/dashboard/creator/partnerships/deal-123')).toBe(true);

    // Root should not falsely match child routes
    expect(isActive('/dashboard/creator', '/dashboard/creator/myideas')).toBe(false);
    expect(isActive('/dashboard/creator', '/dashboard/creator/crossroads')).toBe(false);
  });
});

describe('BuyoutOfferForm Component', () => {
  it('renders BuyoutOfferForm with prefilled asking price', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <BuyoutOfferForm
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        projectName="Nova Health"
        creatorName="Alice Creator"
        askingPrice={50000}
      />
    );

    expect(screen.getByText('Make Full Buyout Offer')).toBeDefined();
    expect(screen.getByText('€50,000')).toBeDefined();
    expect(screen.getByDisplayValue('50000')).toBeDefined();
    expect(screen.getByText('Full Intellectual Property & Concept Ownership')).toBeDefined();
  });

  it('submits buyout offer payload when valid form is submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <BuyoutOfferForm
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        projectName="Nova Health"
        creatorName="Alice Creator"
        askingPrice={35000}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit Full Buyout Offer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          purchasePrice: 35000,
          handoverPeriodWeeks: 2,
          transitionSupportWeeks: 4,
          includedAssets: expect.arrayContaining([
            'Full Intellectual Property & Concept Ownership',
          ]),
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('validates zero or negative purchase price', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <BuyoutOfferForm
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        projectName="Nova Health"
        creatorName="Alice Creator"
      />
    );

    const priceInput = screen.getByPlaceholderText('25000');
    fireEvent.change(priceInput, { target: { value: '0' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Full Buyout Offer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid purchase price greater than zero/i)).toBeDefined();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});

describe('BuyoutOfferReviewModal Component', () => {
  const sampleBuyoutDeal: any = {
    id: 'deal_buyout_1',
    ideaId: 'idea_1',
    creatorId: 'creator_1',
    creatorName: 'Alice Creator',
    entrepreneurId: 'ent_1',
    entrepreneurName: 'Bob Entrepreneur',
    projectName: 'SolarFlow NextGen',
    dealType: 'FULL_BUYOUT',
    dealStage: 'OFFER_NEGOTIATION',
    status: 'initiated',
    currentRevisionNumber: 1,
    currentTurn: 'creator',
    buyoutTerms: {
      purchasePrice: 45000,
      handoverPeriodWeeks: 3,
      transitionSupportWeeks: 6,
      includedAssets: ['Full Intellectual Property & Concept Ownership', 'Complete Business Plan & Financial Model'],
      expiresAt: new Date(Date.now() + 864000000).toISOString(),
      notes: 'We are prepared to acquire immediately upon IP assignment.',
    },
    revisions: [
      {
        revisionNumber: 1,
        offeredByRole: 'entrepreneur',
        offeredByUserId: 'ent_1',
        status: 'pending',
        buyoutTerms: {
          purchasePrice: 45000,
          handoverPeriodWeeks: 3,
          transitionSupportWeeks: 6,
          includedAssets: ['Full Intellectual Property & Concept Ownership', 'Complete Business Plan & Financial Model'],
        },
        note: 'We are prepared to acquire immediately upon IP assignment.',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  it('renders Buyout Offer terms and stage visualizer properly', () => {
    const onAccept = vi.fn();
    const onCounter = vi.fn();
    const onReject = vi.fn();
    const onClose = vi.fn();

    render(
      <BuyoutOfferReviewModal
        isOpen={true}
        onClose={onClose}
        deal={sampleBuyoutDeal}
        isCreator={true}
        askingPrice={50000}
        onAccept={onAccept}
        onCounter={onCounter}
        onReject={onReject}
      />
    );

    expect(screen.getByText('SolarFlow NextGen')).toBeDefined();
    expect(screen.getByText('Full Buyout Acquisition')).toBeDefined();
    expect(screen.getByText('Revision V1')).toBeDefined();
    expect(screen.getByText('€45,000')).toBeDefined();
    expect(screen.getByText('Asking: €50,000')).toBeDefined();
    expect(screen.getByText('3 weeks handover')).toBeDefined();
    expect(screen.getByText('+ 6 weeks transition support')).toBeDefined();
    expect(screen.getByText('Full Intellectual Property & Concept Ownership')).toBeDefined();
    expect(screen.getByText('Commercial Offer')).toBeDefined();
    expect(screen.getByText('Legal & Transfer')).toBeDefined();
    expect(screen.getByText('Closing')).toBeDefined();
    expect(screen.getByText('Sold')).toBeDefined();
  });

  it('triggers onAccept when Accept Buyout Terms button is clicked', async () => {
    const onAccept = vi.fn().mockResolvedValue(undefined);
    const onCounter = vi.fn();
    const onReject = vi.fn();
    const onClose = vi.fn();

    render(
      <BuyoutOfferReviewModal
        isOpen={true}
        onClose={onClose}
        deal={sampleBuyoutDeal}
        isCreator={true}
        onAccept={onAccept}
        onCounter={onCounter}
        onReject={onReject}
      />
    );

    const acceptBtn = screen.getByRole('button', { name: /Accept Buyout Terms/i });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(onAccept).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows waiting notice when not user turn', () => {
    const onAccept = vi.fn();
    const onCounter = vi.fn();
    const onReject = vi.fn();
    const onClose = vi.fn();

    const waitingDeal = {
      ...sampleBuyoutDeal,
      currentTurn: 'entrepreneur', // Creator is viewing but turn is entrepreneur
    };

    render(
      <BuyoutOfferReviewModal
        isOpen={true}
        onClose={onClose}
        deal={waitingDeal}
        isCreator={true}
        onAccept={onAccept}
        onCounter={onCounter}
        onReject={onReject}
      />
    );

    expect(screen.getByText(/Waiting for Bob Entrepreneur Response/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Accept Buyout Terms/i })).toBeNull();
  });

  it('displays agreed banner when deal stage is BUYOUT_TERMS_ACCEPTED', () => {
    const onAccept = vi.fn();
    const onCounter = vi.fn();
    const onReject = vi.fn();
    const onClose = vi.fn();

    const acceptedDeal = {
      ...sampleBuyoutDeal,
      dealStage: 'BUYOUT_TERMS_ACCEPTED',
      acceptedRevisionNumber: 1,
      currentTurn: '',
    };

    render(
      <BuyoutOfferReviewModal
        isOpen={true}
        onClose={onClose}
        deal={acceptedDeal}
        isCreator={true}
        onAccept={onAccept}
        onCounter={onCounter}
        onReject={onReject}
      />
    );

    expect(screen.getByText('Buyout Commercial Terms Agreed')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Accept Buyout Terms/i })).toBeNull();
  });

  it('switches to revision history tab and lists all revisions', () => {
    const onAccept = vi.fn();
    const onCounter = vi.fn();
    const onReject = vi.fn();
    const onClose = vi.fn();

    const multiRevDeal = {
      ...sampleBuyoutDeal,
      revisions: [
        {
          revisionNumber: 1,
          offeredByRole: 'entrepreneur',
          offeredByUserId: 'ent_1',
          status: 'countered',
          buyoutTerms: { purchasePrice: 40000, handoverPeriodWeeks: 2 },
          createdAt: new Date().toISOString(),
        },
        {
          revisionNumber: 2,
          offeredByRole: 'creator',
          offeredByUserId: 'creator_1',
          status: 'pending',
          buyoutTerms: { purchasePrice: 48000, handoverPeriodWeeks: 4 },
          createdAt: new Date().toISOString(),
        },
      ],
    };

    render(
      <BuyoutOfferReviewModal
        isOpen={true}
        onClose={onClose}
        deal={multiRevDeal}
        isCreator={true}
        onAccept={onAccept}
        onCounter={onCounter}
        onReject={onReject}
      />
    );

    const historyTabBtn = screen.getByRole('button', { name: /Revision History \(2\)/i });
    fireEvent.click(historyTabBtn);

    expect(screen.getByText('Revision V1')).toBeDefined();
    expect(screen.getAllByText('Revision V2').length).toBeGreaterThan(0);
    expect(screen.getByText('Purchase Price: €40,000')).toBeDefined();
    expect(screen.getByText('Purchase Price: €48,000')).toBeDefined();
  });
});
