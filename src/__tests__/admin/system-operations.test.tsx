import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import api from '@/lib/axios';
import AdminSystemOverviewPage from '@/app/dashboard/admin/system/page';
import AdminSystemHealthPage from '@/app/dashboard/admin/system/health/page';
import AdminJobsMonitoringPage from '@/app/dashboard/admin/system/jobs/page';
import AdminNotificationsOperationsPage from '@/app/dashboard/admin/system/notifications/page';
import AdminOperationalQueuesPage from '@/app/dashboard/admin/system/queues/page';
import AdminPlatformControlsPage from '@/app/dashboard/admin/system/controls/page';

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'superadmin-1', name: 'Mondial SuperAdmin', email: 'superadmin@mondial.admin', role: 'SuperAdmin', roles: ['Admin', 'SuperAdmin'] },
    isBackendVerified: true,
    isLoading: false,
  }),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Admin Phase 6 — System & Operations Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders System Overview page with operational cards and health status', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: {
          overallStatus: 'Healthy',
          health: {
            overallStatus: 'Healthy',
            api: { status: 'Healthy', message: 'API core operational' },
            database: { status: 'Healthy', message: 'MongoDB connected', responseTimeMs: 5 },
            hangfire: { status: 'Healthy', message: '1 server active' },
            notifications: { status: 'Healthy', message: 'Dispatchers active' },
            storage: { status: 'Healthy', message: 'Media storage operational' },
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
          jobStats: {
            enqueued: 2,
            processing: 0,
            scheduled: 5,
            succeeded: 120,
            failed: 1,
            serversCount: 1,
            recurringJobsCount: 3,
            queues: ['default', 'ai'],
          },
          queues: {
            pendingKycCount: 4,
            pendingInvestorVerificationsCount: 2,
            pendingServiceProviderVerificationsCount: 1,
            openReportsCount: 3,
            openDisputesCount: 0,
            pendingPayoutsCount: 2,
            failedJobsCount: 1,
            generatedAt: new Date().toISOString(),
          },
          notificationStats: {
            totalInApp: 340,
            unreadInApp: 15,
            readInApp: 325,
            createdToday: 12,
            channels: [],
          },
          environment: {
            environmentName: 'Development',
            frameworkVersion: '.NET 8.0',
            applicationVersion: '1.0.0',
            commitHash: 'test-commit',
            serverTimeUtc: new Date().toISOString(),
            timeZone: 'UTC',
            uptime: '01:30:00',
            hostName: 'test-host',
          },
          platformSettings: {
            registrationEnabled: true,
            marketplacePublishingEnabled: true,
            payoutRequestsEnabled: true,
            reportsEnabled: true,
            maintenanceBannerEnabled: false,
            maintenanceBannerTitle: '',
            maintenanceBannerMessage: '',
            maintenanceBannerSeverity: 'info',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin',
            version: 1,
          },
        },
      },
    });

    render(<AdminSystemOverviewPage />);

    expect(await screen.findByText('System Operations & Platform Health')).toBeInTheDocument();
    expect(await screen.findByText('Overall Health')).toBeInTheDocument();
    expect(await screen.findByText('API Application Core')).toBeInTheDocument();
    expect(await screen.findByText('MongoDB Database Cluster')).toBeInTheDocument();
    expect(await screen.findByText('Development')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/admin/system/overview');
  });

  it('renders Component Health page with granular diagnostics', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: {
          overallStatus: 'Healthy',
          api: { status: 'Healthy', message: 'ASP.NET Core API process operational.' },
          database: { status: 'Healthy', message: 'MongoDB cluster connected and responding to ping.', responseTimeMs: 2 },
          hangfire: { status: 'Healthy', message: '1 Hangfire server(s) active.' },
          notifications: { status: 'Healthy', message: 'Notification engine operational.' },
          storage: { status: 'Healthy', message: 'Database & media storage operational.' },
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
    });

    render(<AdminSystemHealthPage />);

    expect(await screen.findByText('System Component Health')).toBeInTheDocument();
    expect(await screen.findByText('API Application Process')).toBeInTheDocument();
    expect(await screen.findByText('MongoDB Database Cluster')).toBeInTheDocument();
    expect(await screen.findByText('Hangfire Job Processing Engine')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/admin/system/health');
  });

  it('renders Jobs page with failed jobs and supports safe retry', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/admin/system/jobs/stats') {
        return Promise.resolve({
          data: {
            data: {
              enqueued: 0,
              processing: 0,
              scheduled: 3,
              succeeded: 80,
              failed: 1,
              serversCount: 1,
              recurringJobsCount: 3,
              queues: ['default'],
            },
          },
        });
      }
      if (url === '/admin/system/jobs/failed') {
        return Promise.resolve({
          data: {
            data: [
              {
                jobId: 'job-999',
                jobType: 'ClientBriefExpirationJob',
                method: 'RunAsync',
                queue: 'default',
                failedAt: new Date().toISOString(),
                exceptionType: 'TimeoutException',
                exceptionMessage: 'Connection timed out during sweep',
                retryCount: 1,
                canRetry: true,
                highRiskReason: null,
              },
            ],
          },
        });
      }
      if (url === '/admin/system/jobs/recurring') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'module3-expire-client-briefs',
                cron: '* * * * *',
                queue: 'default',
                jobType: 'ClientBriefExpirationJob',
                method: 'RunAsync',
                lastExecution: new Date().toISOString(),
                nextExecution: new Date().toISOString(),
                lastJobState: 'Succeeded',
                timeZone: 'UTC',
              },
            ],
          },
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        data: {
          jobId: 'job-999',
          success: true,
          message: "Job 'job-999' successfully requeued.",
        },
      },
    });

    render(<AdminJobsMonitoringPage />);

    expect(await screen.findByText('Background Jobs & Queue Operations')).toBeInTheDocument();
    expect(await screen.findByText('ClientBriefExpirationJob')).toBeInTheDocument();
    expect(await screen.findByText('Connection timed out during sweep')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/system/jobs/job-999/retry');
    });
  });

  it('renders Operational Queues aggregator page with deep links', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: {
          pendingKycCount: 5,
          pendingInvestorVerificationsCount: 2,
          pendingServiceProviderVerificationsCount: 3,
          openReportsCount: 4,
          openDisputesCount: 1,
          pendingPayoutsCount: 2,
          failedJobsCount: 0,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    render(<AdminOperationalQueuesPage />);

    expect(await screen.findByText('Operational Queues & Backlogs')).toBeInTheDocument();
    expect(await screen.findByText('Pending User KYC Identities')).toBeInTheDocument();
    expect(await screen.findByText('Open Reports & Abuse Flags')).toBeInTheDocument();
    expect(await screen.findByText('Pending Payout Requests')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/admin/system/queues');
  });

  it('renders Platform Controls page and updates settings with server-side enforcement', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: {
          registrationEnabled: true,
          marketplacePublishingEnabled: true,
          payoutRequestsEnabled: true,
          reportsEnabled: true,
          maintenanceBannerEnabled: false,
          maintenanceBannerTitle: '',
          maintenanceBannerMessage: '',
          maintenanceBannerSeverity: 'info',
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin',
          version: 1,
        },
      },
    });

    vi.mocked(api.put).mockResolvedValueOnce({
      data: {
        data: {
          registrationEnabled: false,
          marketplacePublishingEnabled: true,
          payoutRequestsEnabled: true,
          reportsEnabled: true,
          maintenanceBannerEnabled: true,
          maintenanceBannerTitle: 'Maintenance Notice',
          maintenanceBannerMessage: 'System upgrades underway.',
          maintenanceBannerSeverity: 'warning',
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin',
          version: 2,
        },
      },
    });

    render(<AdminPlatformControlsPage />);

    expect(await screen.findByText('Platform Controls & Availability Authority')).toBeInTheDocument();
    expect(await screen.findByLabelText('New User Registrations')).toBeChecked();

    // Toggle registration off
    const regToggle = screen.getByLabelText('New User Registrations');
    fireEvent.click(regToggle);
    expect(regToggle).not.toBeChecked();

    // Save controls
    const saveBtn = screen.getByRole('button', { name: /save & enforce controls/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/admin/system/controls',
        expect.objectContaining({
          registrationEnabled: false,
          expectedVersion: 1,
        })
      );
    });

    expect(await screen.findByText('Platform controls successfully saved and enforced server-side.')).toBeInTheDocument();
  });

  it('hides System & Operations from Admin menu and shows it for SuperAdmin', async () => {
    const { menu } = await import('@/lib/menu');
    const { UserRole } = await import('@/lib/roles');

    const adminSections = menu[UserRole.ADMIN];
    const superAdminSections = menu[UserRole.SUPERADMIN];

    const adminHasSystem = adminSections.some(s =>
      s.items.some(i => i.label === 'System & Operations' || i.href === '/dashboard/admin/system')
    );
    const superAdminHasSystem = superAdminSections.some(s =>
      s.items.some(i => i.label === 'System & Operations' || i.href === '/dashboard/admin/system')
    );

    expect(adminHasSystem).toBe(false);
    expect(superAdminHasSystem).toBe(true);
  });
});
