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
  it('contains the canonical 5 menu sections with exact items and routes in product-journey order', () => {
    const creatorMenu = menu[UserRole.CREATOR];
    expect(creatorMenu).toBeDefined();
    expect(creatorMenu.length).toBe(5);

    // 1. MAIN
    expect(creatorMenu[0].title).toBe('Main');
    expect(creatorMenu[0].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Dashboard', href: '/dashboard/creator' },
      { label: 'My Ideas', href: '/dashboard/creator/myideas' },
    ]);

    // 2. BUILD YOUR PROJECT
    expect(creatorMenu[1].title).toBe('Build Your Project');
    expect(creatorMenu[1].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Project Studio', href: '/dashboard/creator/project-studio' },
      { label: 'Offer & Pricing', href: '/dashboard/creator/offer-pricing' },
      { label: 'Marketplace Push', href: '/dashboard/creator/crossroads' },
      { label: 'Growth & Readiness', href: '/dashboard/creator/investors' },
    ]);

    // 3. DEALS & NETWORK
    expect(creatorMenu[2].title).toBe('Deals & Network');
    expect(creatorMenu[2].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'My Partnerships', href: '/dashboard/creator/partnerships' },
      { label: 'My Sales', href: '/dashboard/creator/sales' },
      { label: 'Services Marketplace', href: '/marketplace/services' },
      { label: 'My Engagements', href: '/dashboard/creator/engagements' },
    ]);

    // 4. COMMUNICATION
    expect(creatorMenu[3].title).toBe('Communication');
    expect(creatorMenu[3].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Messages', href: '/dashboard/creator/messages' },
      { label: 'Notifications', href: '/dashboard/creator/notifications' },
    ]);

    // 5. ASSETS & SETTINGS
    expect(creatorMenu[4].title).toBe('Assets & Settings');
    expect(creatorMenu[4].items.map((i) => ({ label: i.label, href: i.href }))).toEqual([
      { label: 'Documents', href: '/dashboard/creator/documents' },
      { label: 'Asset Library', href: '/dashboard/creator/asset-library' },
      { label: 'My Profile', href: '/dashboard/profile' },
      { label: 'Settings', href: '/dashboard/creator/settings' },
    ]);

    // Flatten all items
    const allItems = creatorMenu.flatMap((s) => s.items);
    const hrefs = allItems.map((i) => i.href);
    const labels = allItems.map((i) => i.label);

    // Verify exactly 16 items
    expect(allItems.length).toBe(16);

    // Verify obsolete dead stubs or unapproved menus are NOT present
    expect(hrefs).not.toContain('/dashboard/creator/marketplace');
    expect(hrefs).not.toContain('/dashboard/creator/hire-providers');
    expect(hrefs).not.toContain('/dashboard/creator/ip-vault');
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
