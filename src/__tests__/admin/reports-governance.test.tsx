import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminReportsPage from '@/app/dashboard/admin/reports/page';
import AdminAuditLogPage from '@/app/dashboard/admin/audit/page';
import AdminGovernancePage from '@/app/dashboard/admin/governance/page';
import { ReportModal } from '@/components/common/ReportModal';
import api from '@/lib/axios';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', name: 'Demo Admin', email: 'demo.admin@mondial.local', role: 'Admin', roles: ['Admin'] },
    isBackendVerified: true,
    isLoading: false,
  }),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('Admin Phase 5: Reports, Abuse, Audit & Governance Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ReportModal Component', () => {
    it('submits a user report successfully', async () => {
      (api.post as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: 'rep-101', status: 'Open', createdAt: '2026-08-31T00:00:00Z' },
        },
      });

      const handleClose = vi.fn();
      render(
        <ReportModal
          isOpen={true}
          onClose={handleClose}
          targetType="ServiceListing"
          targetId="srv-1"
          targetTitle="Custom Landing Page Design"
        />
      );

      expect(screen.getByText(/Report Content/i)).toBeInTheDocument();
      expect(screen.getByText(/Custom Landing Page Design/i)).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Explain what is misleading/i);
      await userEvent.type(textarea, 'Fake guarantees and spam links');

      const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/reports', {
          targetType: 'ServiceListing',
          targetId: 'srv-1',
          category: 'Spam',
          description: 'Fake guarantees and spam links',
        });
      });
    });
  });

  describe('AdminReportsPage', () => {
    it('renders reports list and single /api relative calls', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              {
                id: 'rep-1',
                targetType: 'ServiceListing',
                targetId: 'srv-1',
                targetSummary: 'Full-Stack Web App',
                reporterId: 'user-1',
                reporterName: 'Alice Reporter',
                reporterEmail: 'alice@mondial.com',
                category: 'FraudOrScamConcern',
                description: 'Payment scam outside platform',
                status: 'Open',
                createdAt: '2026-08-31T12:00:00Z',
                updatedAt: '2026-08-31T12:00:00Z',
              },
            ],
            totalCount: 1,
            page: 1,
            pageSize: 15,
            totalPages: 1,
          },
        },
      });

      render(<AdminReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Full-Stack Web App')).toBeInTheDocument();
        expect(screen.getByText('Alice Reporter')).toBeInTheDocument();
        expect(screen.getByText('FraudOrScamConcern')).toBeInTheDocument();
      });

      expect(api.get).toHaveBeenCalledWith('/admin/reports', expect.any(Object));
    });
  });

  describe('AdminAuditLogPage', () => {
    it('renders audit events with sanitized fields', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url === '/admin/audit') {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                items: [
                  {
                    id: 'aud-1',
                    action: 'admin_service_hidden',
                    actor: 'admin@mondial.com',
                    success: true,
                    targetType: 'ServiceListing',
                    targetId: 'srv-99',
                    ipAddress: '127.0.0.1',
                    correlationId: 'req-12345',
                    timestamp: '2026-08-31T12:00:00Z',
                    details: { serviceId: 'srv-99', reason: 'Misleading pricing' },
                  },
                ],
                totalCount: 1,
                page: 1,
                pageSize: 20,
                totalPages: 1,
              },
            },
          });
        }
        if (url === '/admin/users') {
          return Promise.resolve({ data: { items: [] } });
        }
        return Promise.resolve({ data: {} });
      });

      render(<AdminAuditLogPage />);

      await waitFor(() => {
        expect(screen.getByText('admin_service_hidden')).toBeInTheDocument();
        expect(screen.getByText('admin@mondial.com')).toBeInTheDocument();
        expect(screen.getByText(/Sensitive Data Redacted/i)).toBeInTheDocument();
      });

      expect(api.get).toHaveBeenCalledWith('/admin/audit', expect.any(Object));
    });
  });

  describe('AdminGovernancePage', () => {
    it('renders governance summary KPIs from real backend metrics', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url === '/admin/governance/summary') {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                openReportsCount: 4,
                underReviewReportsCount: 2,
                resolvedReportsCount: 10,
                dismissedReportsCount: 3,
                totalReportsCount: 19,
                hiddenServicesCount: 2,
                hiddenCreatorOffersCount: 1,
                hiddenReviewsCount: 3,
                suspendedUsersCount: 0,
                openDisputesCount: 1,
                pendingVerificationsCount: 27,
                totalAuditEventsCount: 145,
                recentAuditEvents: [
                  {
                    id: 'aud-1',
                    action: 'report_submitted',
                    actor: 'alice@mondial.com',
                    success: true,
                    timestamp: '2026-08-31T12:00:00Z',
                  },
                ],
              },
            },
          });
        }
        if (url === '/admin/users') {
          return Promise.resolve({ data: { items: [] } });
        }
        return Promise.resolve({ data: {} });
      });

      render(<AdminGovernancePage />);

      await waitFor(() => {
        expect(screen.getByText('Platform Governance & Safety Hub')).toBeInTheDocument();
        expect(screen.getByText('Open Reports')).toBeInTheDocument();
        expect(screen.getByText('Moderation Interventions')).toBeInTheDocument();
        expect(screen.getByText(/Total 145 recorded audit events/i)).toBeInTheDocument();
      });

      expect(api.get).toHaveBeenCalledWith('/admin/governance/summary');
    });
  });
});
