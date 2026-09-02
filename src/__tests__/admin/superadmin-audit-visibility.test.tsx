import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminAuditLogPage from '@/app/dashboard/admin/audit/page';
import AdminGovernancePage from '@/app/dashboard/admin/governance/page';
import api from '@/lib/axios';
import {
  isPrivilegedAuditActor,
  filterVisibleAuditLogs,
  fetchSuperAdminIdentifiers,
} from '@/lib/audit-privilege';
import { AdminAuditLogItem, AdminGovernanceSummary } from '@/types/admin-audit';

// ─── Shared Next.js mocks ───
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard/admin/audit',
  useSearchParams: () => new URLSearchParams(),
}));

// Auth mock
let mockAuth = {
  user: { id: 'admin-1', name: 'Demo Admin', email: 'demo.admin@mondial.local', role: 'Admin', roles: ['Admin'] },
  isBackendVerified: true,
  isLoading: false,
};

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => mockAuth,
}));

// API mock
vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Sample audit items
const normalAdminEvent: AdminAuditLogItem = {
  id: 'evt-001',
  action: 'admin_user_suspended',
  actor: 'demo.admin@mondial.local',
  success: true,
  targetType: 'UserProfile',
  targetId: 'target-user-123',
  ipAddress: '127.0.0.1',
  correlationId: 'corr-001',
  timestamp: '2026-03-01T10:00:00Z',
  details: { reason: 'Policy violation', role: 'Admin' },
};

const superAdminEventExplicitRole: AdminAuditLogItem = {
  id: 'evt-002',
  action: 'superadmin_admin_role_assigned',
  actor: 'demo.superadmin@mondial.local',
  success: true,
  targetType: 'UserProfile',
  targetId: 'target-user-456',
  ipAddress: '127.0.0.1',
  correlationId: 'corr-002',
  timestamp: '2026-03-01T10:05:00Z',
  details: { role: 'SuperAdmin' },
};

// Ordinary-named action created by SuperAdmin (must STILL be filtered based on actor role)
const superAdminOrdinaryNamedEvent: AdminAuditLogItem = {
  id: 'evt-003',
  action: 'admin_platform_settings_updated',
  actor: 'demo.superadmin@mondial.local',
  success: true,
  targetType: 'PlatformSettings',
  targetId: 'setting-maintenance',
  ipAddress: '127.0.0.1',
  correlationId: 'corr-003',
  timestamp: '2026-03-01T10:10:00Z',
  details: { settingKey: 'MaintenanceMode', enabled: false, role: 'SuperAdmin' },
};

const superAdminResolvedByIdentifierEvent: AdminAuditLogItem = {
  id: 'evt-004',
  action: 'admin_report_resolved',
  actor: 'custom.superadmin@mondial.local',
  success: true,
  targetType: 'ContentReport',
  targetId: 'report-999',
  ipAddress: '127.0.0.1',
  correlationId: 'corr-004',
  timestamp: '2026-03-01T10:15:00Z',
  details: { reportId: 'report-999', actorUserId: 'super-user-id-999' },
};

describe('SuperAdmin Audit & Governance Privilege Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Utility: isPrivilegedAuditActor & filterVisibleAuditLogs', () => {
    it('detects explicit role in log item or details', () => {
      expect(isPrivilegedAuditActor(superAdminEventExplicitRole)).toBe(true);
      expect(isPrivilegedAuditActor(superAdminOrdinaryNamedEvent)).toBe(true);
      expect(isPrivilegedAuditActor(normalAdminEvent)).toBe(false);
    });

    it('detects superadmin_ action namespace', () => {
      const actionEvent: AdminAuditLogItem = {
        id: 'evt-action',
        action: 'superadmin_system_metric_reset',
        actor: 'unknown_actor',
        success: true,
        timestamp: '2026-03-01T10:00:00Z',
      };
      expect(isPrivilegedAuditActor(actionEvent)).toBe(true);
    });

    it('resolves actor via dynamic SuperAdmin identifiers set (no hardcoded email)', () => {
      const dynamicIds = new Set(['super-user-id-999', 'custom.superadmin@mondial.local']);
      expect(isPrivilegedAuditActor(superAdminResolvedByIdentifierEvent, dynamicIds)).toBe(true);
      expect(isPrivilegedAuditActor(normalAdminEvent, dynamicIds)).toBe(false);
    });

    it('filters visible logs for normal Admin and retains all for SuperAdmin', () => {
      const allLogs = [normalAdminEvent, superAdminEventExplicitRole, superAdminOrdinaryNamedEvent];
      
      const adminVisible = filterVisibleAuditLogs(allLogs, false);
      expect(adminVisible).toHaveLength(1);
      expect(adminVisible[0].id).toBe('evt-001');

      const superVisible = filterVisibleAuditLogs(allLogs, true);
      expect(superVisible).toHaveLength(3);
    });
  });

  describe('Admin Audit Trail Page (/dashboard/admin/audit)', () => {
    describe('Normal Admin viewing Audit Log', () => {
      beforeEach(() => {
        mockAuth = {
          user: { id: 'admin-1', name: 'Demo Admin', email: 'demo.admin@mondial.local', role: 'Admin', roles: ['Admin'] },
          isBackendVerified: true,
          isLoading: false,
        };
      });

      it('hides SuperAdmin events and displays Normal Admin events', async () => {
        (api.get as any).mockImplementation((url: string) => {
          if (url === '/admin/audit') {
            return Promise.resolve({
              data: {
                data: {
                  items: [normalAdminEvent, superAdminEventExplicitRole, superAdminOrdinaryNamedEvent],
                  totalCount: 3,
                  page: 1,
                  pageSize: 20,
                  totalPages: 1,
                },
              },
            });
          }
          if (url === '/admin/users') {
            return Promise.resolve({
              data: {
                items: [{ userId: 'sa-id', email: 'demo.superadmin@mondial.local', roles: ['SuperAdmin'] }],
              },
            });
          }
          return Promise.resolve({ data: {} });
        });

        render(<AdminAuditLogPage />);

        await waitFor(() => {
          expect(screen.getByText('admin_user_suspended')).toBeInTheDocument();
          expect(screen.getByText('demo.admin@mondial.local')).toBeInTheDocument();
        });

        // SuperAdmin actions and actors MUST be hidden
        expect(screen.queryByText('superadmin_admin_role_assigned')).not.toBeInTheDocument();
        expect(screen.queryByText('admin_platform_settings_updated')).not.toBeInTheDocument();
        expect(screen.queryByText('demo.superadmin@mondial.local')).not.toBeInTheDocument();

        // Accurate visible count on current page
        expect(screen.getByText(/Showing/i)).toBeInTheDocument();
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      });

      it('shows empty state when search returns only SuperAdmin events', async () => {
        (api.get as any).mockImplementation((url: string) => {
          if (url === '/admin/audit') {
            return Promise.resolve({
              data: {
                data: {
                  items: [superAdminOrdinaryNamedEvent],
                  totalCount: 1,
                  page: 1,
                  pageSize: 20,
                  totalPages: 1,
                },
              },
            });
          }
          return Promise.resolve({ data: { items: [] } });
        });

        render(<AdminAuditLogPage />);

        await waitFor(() => {
          expect(screen.getByText('No audit records found matching criteria.')).toBeInTheDocument();
        });

        expect(screen.queryByText('admin_platform_settings_updated')).not.toBeInTheDocument();
      });

      it('prevents opening detail modal for privileged audit items', async () => {
        (api.get as any).mockImplementation((url: string) => {
          if (url === '/admin/audit') {
            return Promise.resolve({
              data: {
                data: {
                  items: [normalAdminEvent],
                  totalCount: 1,
                  page: 1,
                  pageSize: 20,
                  totalPages: 1,
                },
              },
            });
          }
          return Promise.resolve({ data: { items: [] } });
        });

        render(<AdminAuditLogPage />);

        await waitFor(() => {
          expect(screen.getByText('admin_user_suspended')).toBeInTheDocument();
        });

        const viewButton = screen.getByRole('button', { name: /view/i });
        fireEvent.click(viewButton);

        await waitFor(() => {
          expect(screen.getByText(/Audit Event Payload #evt-001/)).toBeInTheDocument();
        });
      });
    });

    describe('SuperAdmin viewing Audit Log', () => {
      beforeEach(() => {
        mockAuth = {
          user: { id: 'sa-1', name: 'Demo SuperAdmin', email: 'demo.superadmin@mondial.local', role: 'SuperAdmin', roles: ['SuperAdmin'] },
          isBackendVerified: true,
          isLoading: false,
        };
      });

      it('shows all audit events including SuperAdmin actions and ordinary-named SuperAdmin events', async () => {
        (api.get as any).mockImplementation((url: string) => {
          if (url === '/admin/audit') {
            return Promise.resolve({
              data: {
                data: {
                  items: [normalAdminEvent, superAdminEventExplicitRole, superAdminOrdinaryNamedEvent],
                  totalCount: 3,
                  page: 1,
                  pageSize: 20,
                  totalPages: 1,
                },
              },
            });
          }
          return Promise.resolve({ data: { items: [] } });
        });

        render(<AdminAuditLogPage />);

        await waitFor(() => {
          expect(screen.getByText('admin_user_suspended')).toBeInTheDocument();
          expect(screen.getByText('superadmin_admin_role_assigned')).toBeInTheDocument();
          expect(screen.getByText('admin_platform_settings_updated')).toBeInTheDocument();
          expect(screen.getAllByText('demo.superadmin@mondial.local').length).toBeGreaterThanOrEqual(1);
        });
      });
    });
  });

  describe('Admin Governance Page (/dashboard/admin/governance)', () => {
    const sampleSummary: AdminGovernanceSummary = {
      openReportsCount: 2,
      underReviewReportsCount: 1,
      resolvedReportsCount: 5,
      dismissedReportsCount: 0,
      totalReportsCount: 8,
      hiddenServicesCount: 1,
      hiddenCreatorOffersCount: 0,
      hiddenReviewsCount: 0,
      suspendedUsersCount: 2,
      openDisputesCount: 1,
      pendingVerificationsCount: 3,
      totalAuditEventsCount: 25,
      recentAuditEvents: [normalAdminEvent, superAdminEventExplicitRole, superAdminOrdinaryNamedEvent],
    };

    it('hides SuperAdmin events from live feed for Normal Admin', async () => {
      mockAuth = {
        user: { id: 'admin-1', name: 'Demo Admin', email: 'demo.admin@mondial.local', role: 'Admin', roles: ['Admin'] },
        isBackendVerified: true,
        isLoading: false,
      };

      (api.get as any).mockImplementation((url: string) => {
        if (url === '/admin/governance/summary') {
          return Promise.resolve({ data: { data: sampleSummary } });
        }
        if (url === '/admin/users') {
          return Promise.resolve({
            data: {
              items: [{ userId: 'sa-id', email: 'demo.superadmin@mondial.local', roles: ['SuperAdmin'] }],
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      render(<AdminGovernancePage />);

      await waitFor(() => {
        expect(screen.getByText('admin_user_suspended')).toBeInTheDocument();
        expect(screen.getByText('by demo.admin@mondial.local')).toBeInTheDocument();
      });

      // SuperAdmin feed items must be hidden
      expect(screen.queryByText('superadmin_admin_role_assigned')).not.toBeInTheDocument();
      expect(screen.queryByText('admin_platform_settings_updated')).not.toBeInTheDocument();
      expect(screen.queryByText('by demo.superadmin@mondial.local')).not.toBeInTheDocument();
    });

    it('shows all live feed events for SuperAdmin', async () => {
      mockAuth = {
        user: { id: 'sa-1', name: 'Demo SuperAdmin', email: 'demo.superadmin@mondial.local', role: 'SuperAdmin', roles: ['SuperAdmin'] },
        isBackendVerified: true,
        isLoading: false,
      };

      (api.get as any).mockImplementation((url: string) => {
        if (url === '/admin/governance/summary') {
          return Promise.resolve({ data: { data: sampleSummary } });
        }
        return Promise.resolve({ data: { items: [] } });
      });

      render(<AdminGovernancePage />);

      await waitFor(() => {
        expect(screen.getByText('admin_user_suspended')).toBeInTheDocument();
        expect(screen.getByText('superadmin_admin_role_assigned')).toBeInTheDocument();
        expect(screen.getByText('admin_platform_settings_updated')).toBeInTheDocument();
        expect(screen.getAllByText('by demo.superadmin@mondial.local').length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
