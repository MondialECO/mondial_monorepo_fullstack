import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminSecurityOverviewPage from '@/app/dashboard/admin/security/page';
import AdminSecurityEventsPage from '@/app/dashboard/admin/security/events/page';
import AdminPrivacyRequestsPage from '@/app/dashboard/admin/privacy/requests/page';
import AdminComplianceCasesPage from '@/app/dashboard/admin/compliance/page';
import AdminDataGovernancePage from '@/app/dashboard/admin/data-governance/page';
import UserPrivacyCenterPage from '@/app/dashboard/privacy/page';
import api from '@/lib/axios';
import { menu } from '@/lib/menu';
import { UserRole } from '@/lib/roles';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

let mockUser = {
  id: 'admin-1',
  name: 'Demo Admin',
  email: 'admin@mondial.local',
  role: 'Admin',
  roles: ['Admin'],
};

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    isBackendVerified: true,
    isLoading: false,
  }),
}));

vi.mock('@/lib/audit-privilege', () => ({
  useSuperAdminIdentifiers: () => ({
    superAdminIdentifiers: new Set(['superadmin@mondial.local', 'super-1']),
    isSuperAdminIdentifier: (email?: string) => email?.toLowerCase() === 'superadmin@mondial.local',
    isLoading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('Admin Phase 7: Security, Compliance, Privacy & Data Governance Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: 'admin-1',
      name: 'Demo Admin',
      email: 'admin@mondial.local',
      role: 'Admin',
      roles: ['Admin'],
    };
  });

  // ==========================================
  // 1. SECURITY OVERVIEW PAGE
  // ==========================================
  describe('Admin Security Overview Page', () => {
    it('renders security KPI counters and inspects user with session revocation', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url === '/admin/security/summary') {
          return Promise.resolve({
            data: {
              data: {
                failedLoginsTodayCount: 14,
                lockedAccountsCount: 2,
                suspendedAccountsCount: 1,
                securityEventsTodayCount: 28,
                openPrivacyRequestsCount: 3,
                openComplianceCasesCount: 2,
                highRiskAccountsCount: 1,
                recentPrivilegedChangesCount: 0,
                recentSecurityEvents: [
                  {
                    id: 'sec-1',
                    action: 'auth_failed',
                    actorEmail: 'attacker@unknown.local',
                    actorRole: 'Anonymous',
                    ipAddress: '192.168.1.50',
                    success: false,
                    timestamp: '2026-09-01T10:00:00Z',
                  },
                ],
              },
            },
          });
        }
        if (url === '/admin/security/users/user-test-1/review') {
          return Promise.resolve({
            data: {
              data: {
                userId: 'user-test-1',
                email: 'creator@mondial.local',
                displayName: 'Test Creator',
                roles: ['Creator'],
                isLocked: false,
                accessFailedCount: 2,
                kycStatus: 'Approved',
                factualSignals: ['Multiple IP changes in last 24h'],
                dependencyCheck: {
                  canSafelyDelete: true,
                  blockers: [],
                },
                recentAuditHistory: [],
              },
            },
          });
        }
        return Promise.reject(new Error('not found'));
      });

      render(<AdminSecurityOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Security & Compliance Overview')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument(); // failed logins
        expect(screen.getByText('attacker@unknown.local')).toBeInTheDocument();
      });

      // Search user
      const searchInput = screen.getByPlaceholderText(/Enter User ID or User Email/i);
      await userEvent.type(searchInput, 'user-test-1');
      const inspectBtn = screen.getByRole('button', { name: /Inspect User/i });
      await userEvent.click(inspectBtn);

      await waitFor(() => {
        expect(screen.getByText('Test Creator')).toBeInTheDocument();
        expect(screen.getByText(/Multiple IP changes in last 24h/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 2. SECURITY EVENTS DIRECTORY PAGE
  // ==========================================
  describe('Admin Security Events Log Page', () => {
    it('renders security events table and handles filter change', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          data: {
            items: [
              {
                id: 'evt-101',
                action: 'account_locked',
                actorEmail: 'target@test.local',
                actorRole: 'Creator',
                ipAddress: '10.0.0.1',
                success: false,
                timestamp: '2026-09-01T09:30:00Z',
                details: 'Account locked due to excessive failed attempts',
              },
            ],
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      });

      render(<AdminSecurityEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Security Events & Audit Logs')).toBeInTheDocument();
        expect(screen.getByText('account_locked')).toBeInTheDocument();
        expect(screen.getByText('target@test.local')).toBeInTheDocument();
      });

      // Safe view modal
      const safeViewBtn = screen.getByRole('button', { name: /Safe View/i });
      await userEvent.click(safeViewBtn);

      await waitFor(() => {
        expect(screen.getByText(/Security Event Details/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 3. PRIVACY REQUESTS QUEUE PAGE
  // ==========================================
  describe('Admin Privacy Requests Queue Page', () => {
    it('renders privacy requests and handles review & completion flow', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url.startsWith('/admin/privacy/requests/req-201')) {
          return Promise.resolve({
            data: {
              data: {
                id: 'req-201',
                userId: 'usr-1',
                userEmail: 'gdpr.user@test.local',
                userDisplayName: 'GDPR Requester',
                requestType: 'AccountDeletion',
                status: 'Open',
                details: 'Please delete my profile permanently',
                createdAt: '2026-09-01T08:00:00Z',
                updatedAt: '2026-09-01T08:00:00Z',
                dependencyCheck: {
                  canSafelyDelete: false,
                  activeEngagementsCount: 1,
                  openDisputesCount: 0,
                  pendingPayoutsCount: 0,
                  transactionCount: 2,
                  blockers: ['User has 1 active workroom engagement(s) in progress.'],
                },
                version: 1,
              },
            },
          });
        }
        if (url.startsWith('/admin/privacy/requests')) {
          return Promise.resolve({
            data: {
              data: {
                items: [
                  {
                    id: 'req-201',
                    userId: 'usr-1',
                    userEmail: 'gdpr.user@test.local',
                    userDisplayName: 'GDPR Requester',
                    requestType: 'AccountDeletion',
                    status: 'Open',
                    details: 'Please delete my profile permanently',
                    createdAt: '2026-09-01T08:00:00Z',
                    updatedAt: '2026-09-01T08:00:00Z',
                    version: 1,
                  },
                ],
                page: 1,
                pageSize: 20,
                totalCount: 1,
                totalPages: 1,
              },
            },
          });
        }
        return Promise.reject(new Error('not found'));
      });

      render(<AdminPrivacyRequestsPage />);

      await waitFor(() => {
        expect(screen.getByText('Privacy & Data Governance Queue')).toBeInTheDocument();
        expect(screen.getByText('gdpr.user@test.local')).toBeInTheDocument();
      });

      // Open Inspect modal
      const inspectBtn = screen.getByRole('button', { name: /Inspect & Decide/i });
      await userEvent.click(inspectBtn);

      await waitFor(() => {
        expect(screen.getByText(/Commercial & Legal Dependency Scan/i)).toBeInTheDocument();
        expect(screen.getByText(/User has 1 active workroom engagement/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 4. COMPLIANCE CASES PAGE
  // ==========================================
  describe('Admin Compliance Cases Page', () => {
    it('renders compliance cases and appends internal note', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url.startsWith('/admin/compliance/cases/case-301')) {
          return Promise.resolve({
            data: {
              data: {
                id: 'case-301',
                caseType: 'DisputeSpike',
                targetUserId: 'usr-dispute',
                targetUserEmail: 'disputed.sp@test.local',
                targetUserDisplayName: 'Disputed Provider',
                status: 'Open',
                priority: 'High',
                summary: 'Multiple chargebacks and project disputes opened within 48h',
                factualSignals: ['2 open dispute tickets', 'KYC verified'],
                notes: [],
                timeline: [
                  {
                    id: 'tl-1',
                    eventType: 'CaseOpened',
                    actorEmail: 'admin@mondial.local',
                    description: 'Case opened by admin@mondial.local',
                    timestamp: '2026-09-01T07:00:00Z',
                  },
                ],
                createdAt: '2026-09-01T07:00:00Z',
                updatedAt: '2026-09-01T07:00:00Z',
                version: 1,
              },
            },
          });
        }
        if (url.startsWith('/admin/compliance/cases')) {
          return Promise.resolve({
            data: {
              data: {
                items: [
                  {
                    id: 'case-301',
                    caseType: 'DisputeSpike',
                    targetUserId: 'usr-dispute',
                    targetUserEmail: 'disputed.sp@test.local',
                    targetUserDisplayName: 'Disputed Provider',
                    status: 'Open',
                    priority: 'High',
                    summary: 'Multiple chargebacks and project disputes opened within 48h',
                    createdAt: '2026-09-01T07:00:00Z',
                    updatedAt: '2026-09-01T07:00:00Z',
                    version: 1,
                  },
                ],
                page: 1,
                pageSize: 20,
                totalCount: 1,
                totalPages: 1,
              },
            },
          });
        }
        return Promise.reject(new Error('not found'));
      });

      render(<AdminComplianceCasesPage />);

      await waitFor(() => {
        expect(screen.getByText('Compliance & High-Risk Cases')).toBeInTheDocument();
        expect(screen.getByText('disputed.sp@test.local')).toBeInTheDocument();
      });

      // View details
      const detailBtn = screen.getByRole('button', { name: /Case Details/i });
      await userEvent.click(detailBtn);

      await waitFor(() => {
        expect(screen.getByText(/2 open dispute tickets/i)).toBeInTheDocument();
        expect(screen.getByText(/Internal Admin Notes/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 5. DATA GOVERNANCE PAGE
  // ==========================================
  describe('Admin Data Governance Page', () => {
    it('renders inventory in read-only mode for normal admin', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          data: [
            {
              dataCategory: 'ApplicationUsers',
              storageAuthority: 'MongoDB applicationUsers',
              dataSensitivity: 'Confidential',
              retentionPolicy: 'Indefinite (Active Accounts)',
              deletionStrategy: 'Anonymization upon request',
              accessAuthority: 'SuperAdmin / System',
              estimatedRecordsCount: 1540,
            },
          ],
        },
      });

      render(<AdminDataGovernancePage />);

      await waitFor(() => {
        expect(screen.getByText('Data Governance & Retention')).toBeInTheDocument();
        expect(screen.getByText('ApplicationUsers')).toBeInTheDocument();
        expect(screen.getByText('1,540')).toBeInTheDocument();
      });
    });

    it('renders editable retention policies for superadmin', async () => {
      mockUser = {
        id: 'super-1',
        name: 'Super Administrator',
        email: 'superadmin@mondial.local',
        role: 'SuperAdmin',
        roles: ['SuperAdmin', 'Admin'],
      };

      (api.get as any).mockImplementation((url: string) => {
        if (url === '/admin/data-governance/inventory') {
          return Promise.resolve({
            data: {
              data: [
                {
                  dataCategory: 'AdminAuditLogs',
                  storageAuthority: 'MongoDB AdminAuditLogs',
                  dataSensitivity: 'High',
                  retentionPolicy: '2555 days',
                  deletionStrategy: 'ReviewOnly',
                  accessAuthority: 'Admin',
                  estimatedRecordsCount: 25000,
                },
              ],
            },
          });
        }
        if (url === '/admin/data-governance/settings') {
          return Promise.resolve({
            data: {
              data: [
                {
                  id: 'pol-1',
                  dataCategory: 'AdminAuditLogs',
                  retentionDays: 2555,
                  actionAfterRetention: 'ReviewOnly',
                  dataSensitivity: 'High',
                  accessAuthority: 'Admin',
                  enabled: true,
                  version: 1,
                },
              ],
            },
          });
        }
        return Promise.reject(new Error('not found'));
      });

      render(<AdminDataGovernancePage />);

      await waitFor(() => {
        expect(screen.getByText('AdminAuditLogs')).toBeInTheDocument();
      });

      const retentionTab = screen.getByRole('tab', { name: /Retention Policies/i });
      await userEvent.click(retentionTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Retention Policies/i })).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 6. USER-FACING PRIVACY CENTER
  // ==========================================
  describe('User Privacy Center Page', () => {
    it('renders user privacy center and submits a data export request', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'req-my-1',
              requestType: 'DataExport',
              status: 'Completed',
              details: 'Personal archive',
              createdAt: '2026-08-30T10:00:00Z',
              completedAt: '2026-08-31T12:00:00Z',
              exportDownloadUrl: '/api/privacy/export/req-my-1/download',
            },
          ],
        },
      });

      render(<UserPrivacyCenterPage />);

      await waitFor(() => {
        expect(screen.getByText('Privacy & Data Center')).toBeInTheDocument();
        expect(screen.getByText('Download Export')).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 7. SUPERADMIN-ONLY RBAC — ROUTE GUARDS
  // ==========================================
  describe('SuperAdmin-only RBAC — Route Guard Layouts', () => {
    it('Normal Admin is blocked from Security routes with Access Denied', async () => {
      mockUser = { id: 'admin-1', name: 'Demo Admin', email: 'admin@mondial.local', role: 'Admin', roles: ['Admin'] };
      const AdminSecurityLayout = (await import('@/app/dashboard/admin/security/layout')).default;
      render(<AdminSecurityLayout><div>Security Content</div></AdminSecurityLayout>);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Security Content')).not.toBeInTheDocument();
      });
    });

    it('Normal Admin is blocked from Privacy admin routes with Access Denied', async () => {
      mockUser = { id: 'admin-1', name: 'Demo Admin', email: 'admin@mondial.local', role: 'Admin', roles: ['Admin'] };
      const AdminPrivacyLayout = (await import('@/app/dashboard/admin/privacy/layout')).default;
      render(<AdminPrivacyLayout><div>Privacy Content</div></AdminPrivacyLayout>);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Privacy Content')).not.toBeInTheDocument();
      });
    });

    it('Normal Admin is blocked from Compliance routes with Access Denied', async () => {
      mockUser = { id: 'admin-1', name: 'Demo Admin', email: 'admin@mondial.local', role: 'Admin', roles: ['Admin'] };
      const AdminComplianceLayout = (await import('@/app/dashboard/admin/compliance/layout')).default;
      render(<AdminComplianceLayout><div>Compliance Content</div></AdminComplianceLayout>);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Compliance Content')).not.toBeInTheDocument();
      });
    });

    it('Normal Admin is blocked from Data Governance routes with Access Denied', async () => {
      mockUser = { id: 'admin-1', name: 'Demo Admin', email: 'admin@mondial.local', role: 'Admin', roles: ['Admin'] };
      const AdminDataGovernanceLayout = (await import('@/app/dashboard/admin/data-governance/layout')).default;
      render(<AdminDataGovernanceLayout><div>Data Governance Content</div></AdminDataGovernanceLayout>);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Data Governance Content')).not.toBeInTheDocument();
      });
    });

    it('SuperAdmin can access Security routes', async () => {
      mockUser = { id: 'sa-1', name: 'Super Admin', email: 'superadmin@mondial.local', role: 'SuperAdmin', roles: ['SuperAdmin'] };
      const AdminSecurityLayout = (await import('@/app/dashboard/admin/security/layout')).default;
      render(<AdminSecurityLayout><div>Security Content</div></AdminSecurityLayout>);

      await waitFor(() => {
        expect(screen.getByText('Security Content')).toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
      });
    });

    it('SuperAdmin can access Privacy admin routes', async () => {
      mockUser = { id: 'sa-1', name: 'Super Admin', email: 'superadmin@mondial.local', role: 'SuperAdmin', roles: ['SuperAdmin'] };
      const AdminPrivacyLayout = (await import('@/app/dashboard/admin/privacy/layout')).default;
      render(<AdminPrivacyLayout><div>Privacy Content</div></AdminPrivacyLayout>);

      await waitFor(() => {
        expect(screen.getByText('Privacy Content')).toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
      });
    });

    it('SuperAdmin can access Compliance routes', async () => {
      mockUser = { id: 'sa-1', name: 'Super Admin', email: 'superadmin@mondial.local', role: 'SuperAdmin', roles: ['SuperAdmin'] };
      const AdminComplianceLayout = (await import('@/app/dashboard/admin/compliance/layout')).default;
      render(<AdminComplianceLayout><div>Compliance Content</div></AdminComplianceLayout>);

      await waitFor(() => {
        expect(screen.getByText('Compliance Content')).toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
      });
    });

    it('SuperAdmin can access Data Governance routes', async () => {
      mockUser = { id: 'sa-1', name: 'Super Admin', email: 'superadmin@mondial.local', role: 'SuperAdmin', roles: ['SuperAdmin'] };
      const AdminDataGovernanceLayout = (await import('@/app/dashboard/admin/data-governance/layout')).default;
      render(<AdminDataGovernanceLayout><div>Data Governance Content</div></AdminDataGovernanceLayout>);

      await waitFor(() => {
        expect(screen.getByText('Data Governance Content')).toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 8. MENU VISIBILITY — ADMIN vs SUPERADMIN
  // ==========================================
  describe('Menu Visibility — Security & Compliance', () => {
    it('Admin menu does NOT contain Security & Compliance', () => {
      const adminSections = menu[UserRole.ADMIN];
      const allLabels = adminSections.flatMap((s: any) => s.items.map((i: any) => i.label));
      expect(allLabels).not.toContain('Security & Compliance');
    });

    it('SuperAdmin menu DOES contain Security & Compliance', () => {
      const superAdminSections = menu[UserRole.SUPERADMIN];
      const allLabels = superAdminSections.flatMap((s: any) => s.items.map((i: any) => i.label));
      expect(allLabels).toContain('Security & Compliance');
    });

    it('Admin menu retains standard modules (Users, Verifications, Commerce, Reports, Audit, Governance)', () => {
      const adminSections = menu[UserRole.ADMIN];
      const allLabels = adminSections.flatMap((s: any) => s.items.map((i: any) => i.label));
      expect(allLabels).toContain('Users');
      expect(allLabels).toContain('Verifications');
      expect(allLabels).toContain('Commerce & Finance');
      expect(allLabels).toContain('Reports & Abuse');
      expect(allLabels).toContain('Audit Logs');
      expect(allLabels).toContain('Governance');
    });

    it('Admin menu does NOT contain System & Operations', () => {
      const adminSections = menu[UserRole.ADMIN];
      const allLabels = adminSections.flatMap((s: any) => s.items.map((i: any) => i.label));
      expect(allLabels).not.toContain('System & Operations');
    });

    it('SuperAdmin menu contains both Security & Compliance AND System & Operations', () => {
      const superAdminSections = menu[UserRole.SUPERADMIN];
      const allLabels = superAdminSections.flatMap((s: any) => s.items.map((i: any) => i.label));
      expect(allLabels).toContain('Security & Compliance');
      expect(allLabels).toContain('System & Operations');
    });
  });
});

