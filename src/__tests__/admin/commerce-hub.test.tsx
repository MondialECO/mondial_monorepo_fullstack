import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminCommerceOverviewPage from '@/app/dashboard/admin/commerce/page';
import AdminEscrowsPage from '@/app/dashboard/admin/escrows/page';
import AdminDisputesPage from '@/app/dashboard/admin/disputes/page';
import AdminPayoutsPage from '@/app/dashboard/admin/payouts/page';
import AdminCommissionPage from '@/app/dashboard/admin/commission/page';
import AdminEngagementsPage from '@/app/dashboard/admin/engagements/page';
import AdminTransactionsPage from '@/app/dashboard/admin/transactions/page';
import api from '@/lib/axios';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Admin Commerce & Financial Management Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Commerce Hub Overview', () => {
    it('renders financial summary metrics correctly', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          data: {
            totalEscrowHeld: 154000,
            activeEscrowContractsCount: 42,
            totalPlatformRevenue: 28600,
            allTimeGMV: 310000,
            openDisputesCount: 3,
            disputedAmountTotal: 12500,
            pendingPayoutsCount: 5,
            pendingPayoutsAmount: 18400,
            defaultCommissionPercentage: 10,
            currency: 'EUR',
          },
        },
      });

      renderWithQueryClient(<AdminCommerceOverviewPage />);

      expect(screen.getByText(/Commerce & Financial/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('€154,000.00')).toBeInTheDocument();
        expect(screen.getByText('€28,600.00')).toBeInTheDocument();
        expect(screen.getByText('€310,000.00')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });

  describe('Escrow & Milestone Monitoring', () => {
    it('renders active escrow milestones with details', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          data: {
            items: [
              {
                milestoneId: 'm-1',
                engagementId: 'eng-1',
                title: 'Phase 1 Frontend Delivery',
                clientName: 'Alice Client',
                providerName: 'Bob Provider',
                amount: 5000,
                currency: 'EUR',
                status: 'Funded',
                fundedAt: '2026-08-15T10:00:00Z',
                deliverablesCount: 2,
                canRelease: true,
                hasDispute: false,
              },
            ],
            totalCount: 1,
            page: 1,
            pageSize: 20,
            totalPages: 1,
          },
        },
      });

      renderWithQueryClient(<AdminEscrowsPage />);

      expect(screen.getByText(/Escrow & Milestone Monitoring/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Phase 1 Frontend Delivery')).toBeInTheDocument();
        expect(screen.getByText('€5,000.00')).toBeInTheDocument();
        expect(screen.getByText('Alice Client')).toBeInTheDocument();
        expect(screen.getByText('Bob Provider')).toBeInTheDocument();
      });
    });
  });

  describe('Dispute Resolution Mediation', () => {
    it('lists disputed milestones and allows opening inspector', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          data: [
            {
              milestoneId: 'm-dispute-1',
              milestoneTitle: 'Backend API Integration',
              engagementId: 'eng-2',
              engagementTitle: 'Enterprise Portal',
              clientId: 'c-1',
              clientName: 'Alpha Corp',
              providerId: 'p-1',
              providerName: 'Beta Devs',
              amount: 8000,
              currency: 'EUR',
              status: 'Disputed',
              disputeOpenedAt: '2026-08-20T14:00:00Z',
            },
          ],
        },
      });

      renderWithQueryClient(<AdminDisputesPage />);

      expect(screen.getByText(/Dispute Resolution Mediation Hub/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Backend API Integration')).toBeInTheDocument();
        expect(screen.getByText('€8,000.00')).toBeInTheDocument();
        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      });
    });
  });

  describe('Payout Requests Management', () => {
    it('renders withdrawal queue and executes payout approval', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'payout-1',
              providerId: 'prov-1',
              providerName: 'Elena Rostova',
              providerEmail: 'elena@example.com',
              grossAmount: 4000,
              feeAmount: 0,
              netAmount: 4000,
              currency: 'EUR',
              status: 'Pending',
              payoutMethod: 'SEPA Bank Transfer',
              destinationDetails: 'DE89370400440532013000',
              requestedAt: '2026-08-25T11:00:00Z',
            },
          ],
        },
      });

      renderWithQueryClient(<AdminPayoutsPage />);

      expect(screen.getByText(/Payout & Withdrawal Requests/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
        expect(screen.getByText('€4,000.00')).toBeInTheDocument();
        expect(screen.getByText('Approve')).toBeInTheDocument();
      });
    });
  });

  describe('Commission & Take-Rate Configuration', () => {
    it('displays platform take-rate settings and simulates order calculations', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          data: {
            defaultCommissionPercentage: 12.5,
            minimumFeeAmount: 25,
            currency: 'EUR',
            categoryOverrides: {
              'Legal & Compliance': 8.0,
            },
            updatedAt: '2026-08-01T00:00:00Z',
            updatedByAdminId: 'admin-1',
          },
        },
      });

      renderWithQueryClient(<AdminCommissionPage />);

      expect(screen.getByText(/Platform Commission & Fee Configuration/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Legal & Compliance')).toBeInTheDocument();
        expect(screen.getByText('8%')).toBeInTheDocument();
      });
    });

    describe('Engagements Directory', () => {
      it('renders engagements list with client and provider links', async () => {
        (api.get as any).mockResolvedValueOnce({
          data: {
            success: true,
            message: 'Engagements fetched',
            data: {
              items: [
                {
                  id: 'eng-100',
                  title: 'Brand Identity Design',
                  description: 'Complete branding package',
                  clientId: 'user-client-1',
                  clientName: 'Acme Corp',
                  clientEmail: 'acme@example.com',
                  providerId: 'user-sp-1',
                  providerName: 'Creative Studio',
                  providerEmail: 'studio@example.com',
                  contractValue: 4500,
                  currency: 'EUR',
                  status: 'Active',
                  escrowStatus: 'Funded',
                  milestonesCount: 3,
                  completionPercentage: 33,
                  createdAt: '2026-08-01T12:00:00Z',
                  hasDispute: false,
                },
              ],
              totalCount: 1,
              page: 1,
              pageSize: 15,
              totalPages: 1,
            },
          },
        });

        renderWithQueryClient(<AdminEngagementsPage />);

        expect(screen.getByText(/Engagements Directory/i)).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.getByText('Brand Identity Design')).toBeInTheDocument();
          expect(screen.getByText('Acme Corp')).toBeInTheDocument();
          expect(screen.getByText('Creative Studio')).toBeInTheDocument();
          expect(screen.getByText('€4,500.00')).toBeInTheDocument();
        });
      });
    });

    describe('Transactions Read-Only Ledger', () => {
      it('renders immutable audit trail and contains no edit or delete actions', async () => {
        (api.get as any).mockResolvedValueOnce({
          data: {
            success: true,
            message: 'Transactions fetched',
            data: {
              items: [
                {
                  id: 'tx-500',
                  createdAt: '2026-08-10T10:00:00Z',
                  transactionType: 'PaymentReleased',
                  paymentStatus: 'Completed',
                  grossAmount: 2000,
                  commissionAmount: 200,
                  netAmount: 1800,
                  currency: 'EUR',
                  clientId: 'client-5',
                  clientName: 'Alpha Client',
                  providerId: 'sp-5',
                  providerName: 'Omega Devs',
                  engagementId: 'eng-50',
                  engagementTitle: 'Fullstack App',
                  idempotencyKey: 'idemp-500',
                },
              ],
              totalCount: 1,
              page: 1,
              pageSize: 20,
              totalPages: 1,
            },
          },
        });

        renderWithQueryClient(<AdminTransactionsPage />);

        expect(screen.getByText(/Financial Transactions Ledger/i)).toBeInTheDocument();
        expect(screen.getByText(/Audit-Grade Immutable Log/i)).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.getByText('PaymentReleased')).toBeInTheDocument();
          expect(screen.getByText('€2,000.00')).toBeInTheDocument();
          expect(screen.getByText('Alpha Client')).toBeInTheDocument();
          expect(screen.getByText('Omega Devs')).toBeInTheDocument();
        });

        // Ensure no edit or delete buttons exist in the DOM
        expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
        expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
      });
    });
  });
});
