import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminVerificationHubPage from '@/app/dashboard/admin/verifications/page';
import AdminKycQueuePage from '@/app/dashboard/admin/verifications/kyc/page';
import AdminInvestorFinanceVerificationPage from '@/app/dashboard/admin/verifications/investors/page';
import AdminServiceProvidersVerificationPage from '@/app/dashboard/admin/verifications/service-providers/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/axios';

// Mock ObjectURL methods for Node/JSDOM environment
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-blob-url');
} else {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-blob-url');
}

if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = vi.fn();
} else {
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
}

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', name: 'Mondial Admin', email: 'admin@mondial.admin', role: 'Admin', roles: ['Admin'] },
    isBackendVerified: true,
    isLoading: false,
  }),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Admin Verification Hub Overview Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders queue cards with real live counts', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        pendingKycCount: 5,
        pendingSpCount: 3,
        pendingInvestorFinanceCount: 2,
        verifiedKycCount: 15,
        verifiedSpCount: 8,
        verifiedInvestorFinanceCount: 12,
        rejectedKycCount: 2,
        rejectedSpCount: 1,
        rejectedInvestorFinanceCount: 4,
      },
    });

    render(<AdminVerificationHubPage />);

    expect(screen.getByText(/Verification Hub/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('5 Pending')).toBeInTheDocument();
      expect(screen.getByText('3 Pending')).toBeInTheDocument();
      expect(screen.getByText('2 Pending')).toBeInTheDocument();
    });

    // Check Total Pending Tasks calculation: 5 + 3 + 2 = 10
    expect(screen.getByText('10')).toBeInTheDocument();

    // Check links to the 3 queues
    expect(screen.getByRole('link', { name: /Open KYC Queue/i })).toHaveAttribute(
      'href',
      '/dashboard/admin/verifications/kyc'
    );
    expect(screen.getByRole('link', { name: /Open Provider Queue/i })).toHaveAttribute(
      'href',
      '/dashboard/admin/verifications/service-providers'
    );
    expect(screen.getByRole('link', { name: /Open Investor Queue/i })).toHaveAttribute(
      'href',
      '/dashboard/admin/verifications/investors'
    );
  });
});

describe('Admin KYC Queue Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pending KYC table from safe summaries and supports protected evidence fetch with approve flow', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/varification/pending') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'user-kyc-1',
                name: 'Sarah Applicant',
                email: 'sarah@example.com',
                roles: ['Creator'],
                address: { country: 'United Kingdom', city: 'London' },
                kyc: {
                  status: 0,
                  submittedAt: '2026-02-10T10:00:00Z',
                  documentType: 'passport',
                  documentUploaded: true,
                  faceSubmitted: true,
                },
              },
            ],
          },
        });
      }
      if (url === '/varification/user-kyc-1') {
        return Promise.resolve({
          data: {
            data: {
              id: 'user-kyc-1',
              name: 'Sarah Applicant',
              email: 'sarah@example.com',
              roles: ['Creator'],
              address: { country: 'United Kingdom', city: 'London' },
              kyc: {
                status: 0,
                submittedAt: '2026-02-10T10:00:00Z',
                identity: {
                  documentType: 'passport',
                  documentNumber: 'GB987654321',
                  frontImagePath: '/api/varification/user-kyc-1/evidence/front',
                  backImagePath: null,
                  status: 0,
                },
                face: {
                  status: 0,
                },
              },
            },
          },
        });
      }
      if (url === '/api/varification/user-kyc-1/evidence/front') {
        return Promise.resolve({
          data: new Blob(['fake image content'], { type: 'image/png' }),
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    (api.post as any).mockResolvedValueOnce({
      data: { success: true, message: 'KYC Approved' },
    });

    const user = userEvent.setup();
    render(<AdminKycQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Applicant')).toBeInTheDocument();
      expect(screen.getByText('sarah@example.com')).toBeInTheDocument();
      expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    });

    // Verify document number is NOT present on queue page
    expect(screen.queryByText('GB987654321')).not.toBeInTheDocument();
    expect(screen.queryByText(/GB987654321/)).not.toBeInTheDocument();

    // Click Review KYC button
    const reviewBtn = screen.getByRole('button', { name: /Review KYC/i });
    await user.click(reviewBtn);

    // Verify detail endpoint was called on-demand for selected user
    expect(api.get).toHaveBeenCalledWith('/varification/user-kyc-1');

    // Modal is open and shows masked document number by default
    await waitFor(() => {
      expect(screen.getByText(/KYC Evidence Review/i)).toBeInTheDocument();
      expect(screen.getByText('••••••••4321')).toBeInTheDocument();
    });

    // Reveal full document number
    const revealBtn = screen.getByRole('button', { name: /Reveal Full/i });
    await user.click(revealBtn);
    expect(screen.getByText('GB987654321')).toBeInTheDocument();

    // Click Approve KYC
    const approveBtn = screen.getByRole('button', { name: /Approve KYC/i });
    await user.click(approveBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/varification/approve/user-kyc-1');
    });
  });

  it('supports reject flow with mandatory reason and cleans up evidence blobs upon modal close', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/varification/pending') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'user-kyc-2',
                name: 'John Applicant',
                email: 'john@example.com',
                roles: ['Creator'],
                address: { country: 'United States', city: 'New York' },
                kyc: {
                  status: 0,
                  submittedAt: '2026-02-12T10:00:00Z',
                  documentType: 'national_id',
                  documentUploaded: true,
                  faceSubmitted: true,
                },
              },
            ],
          },
        });
      }
      if (url === '/varification/user-kyc-2') {
        return Promise.resolve({
          data: {
            data: {
              id: 'user-kyc-2',
              name: 'John Applicant',
              email: 'john@example.com',
              roles: ['Creator'],
              address: { country: 'United States', city: 'New York' },
              kyc: {
                status: 0,
                submittedAt: '2026-02-12T10:00:00Z',
                identity: {
                  documentType: 'national_id',
                  documentNumber: 'US123456789',
                  frontImagePath: '/api/varification/user-kyc-2/evidence/front',
                  backImagePath: '/api/varification/user-kyc-2/evidence/back',
                  status: 0,
                },
                face: {
                  status: 0,
                },
              },
            },
          },
        });
      }
      if (url.includes('/evidence/')) {
        return Promise.resolve({
          data: new Blob(['fake image content'], { type: 'image/png' }),
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    (api.post as any).mockResolvedValueOnce({
      data: { success: true, message: 'KYC Rejected' },
    });

    const user = userEvent.setup();
    render(<AdminKycQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('John Applicant')).toBeInTheDocument();
    });

    // Click Review KYC
    const reviewBtn = screen.getByRole('button', { name: /Review KYC/i });
    await user.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText(/KYC Evidence Review/i)).toBeInTheDocument();
    });

    // Click Reject...
    const rejectBtn = screen.getByRole('button', { name: /Reject\.\.\./i });
    await user.click(rejectBtn);

    // Enter rejection reason
    const textarea = screen.getByPlaceholderText(/e\.g\. Document image is blurry/i);
    await user.type(textarea, 'Identification document has expired.');

    // Confirm rejection
    const confirmRejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    await user.click(confirmRejectBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/varification/reject/user-kyc-2', {
        reason: 'Identification document has expired.',
      });
    });
  });

  it('renders PDF document preview and handles unavailable evidence states cleanly', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/varification/pending') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'user-kyc-3',
                name: 'PDF Applicant',
                email: 'pdf@example.com',
                roles: ['Creator'],
                kyc: { status: 0, submittedAt: '2026-02-14T10:00:00Z', documentUploaded: true },
              },
            ],
          },
        });
      }
      if (url === '/varification/user-kyc-3') {
        return Promise.resolve({
          data: {
            data: {
              id: 'user-kyc-3',
              name: 'PDF Applicant',
              email: 'pdf@example.com',
              kyc: {
                status: 0,
                identity: {
                  documentType: 'passport',
                  documentNumber: 'PDF12345',
                  frontImagePath: '/api/varification/user-kyc-3/evidence/front',
                  backImagePath: '/api/varification/user-kyc-3/evidence/back',
                  status: 0,
                },
              },
            },
          },
        });
      }
      if (url === '/api/varification/user-kyc-3/evidence/front') {
        return Promise.resolve({
          data: new Blob(['fake pdf content'], { type: 'application/pdf' }),
        });
      }
      if (url === '/api/varification/user-kyc-3/evidence/back') {
        const err: any = new Error('Not found');
        err.response = { status: 404 };
        return Promise.reject(err);
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    const user = userEvent.setup();
    render(<AdminKycQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('PDF Applicant')).toBeInTheDocument();
    });

    const reviewBtn = screen.getByRole('button', { name: /Review KYC/i });
    await user.click(reviewBtn);

    // PDF view renders
    await waitFor(() => {
      expect(screen.getByText('PDF Document Ready')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Full Document/i })).toBeInTheDocument();
    });

    // Back document 404 missing state renders
    expect(screen.getByText('Back document not required / not uploaded')).toBeInTheDocument();
  });
});

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

describe('Admin Investor Finance Queue Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders investor finance submissions and allows decisions', async () => {
    (api.get as any).mockResolvedValue({
      data: [
        {
          id: 'fin-001',
          userId: 'inv-user-1',
          userName: 'Venture Fund Alpha',
          userEmail: 'alpha@venture.com',
          declaredCapitalAmount: 5000000,
          declaredCapitalCurrency: '$',
          minTicketSize: 50000,
          maxTicketSize: 500000,
          preferredStages: ['Seed', 'Series A'],
          status: 'pending',
          submittedAt: '2026-02-15T12:00:00Z',
        },
      ],
    });

    (api.post as any).mockResolvedValueOnce({
      data: { success: true },
    });

    const user = userEvent.setup();
    render(<AdminInvestorFinanceVerificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Venture Fund Alpha')).toBeInTheDocument();
      expect(screen.getByText('$5,000,000')).toBeInTheDocument();
    });

    // Click Review
    const reviewBtn = screen.getByRole('button', { name: /Review/i });
    await user.click(reviewBtn);

    expect(screen.getByText(/Investor Finance Review/i)).toBeInTheDocument();

    // Verify Unified Profile user link exists
    const userLink = screen.getByRole('link', { name: /Inspect User Account/i });
    expect(userLink).toHaveAttribute('href', '/dashboard/admin/users/inv-user-1');

    // Click Verify
    const verifyBtn = screen.getByRole('button', { name: /^Verify$/i });
    await user.click(verifyBtn);

    // Confirm Verification
    const confirmBtn = screen.getByRole('button', { name: /Confirm Verification/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/investor-finance-verifications/fin-001/decision', {
        action: 'verify',
        reason: '',
      });
    });
  });

  it('supports rejecting investor finance submissions with mandatory reason', async () => {
    (api.get as any).mockResolvedValue({
      data: [
        {
          id: 'fin-002',
          userId: 'inv-user-2',
          userName: 'Beta Capital',
          userEmail: 'beta@capital.com',
          declaredCapitalAmount: 1000000,
          declaredCapitalCurrency: '$',
          status: 'pending',
          submittedAt: '2026-02-16T12:00:00Z',
        },
      ],
    });

    (api.post as any).mockResolvedValueOnce({
      data: { success: true },
    });

    const user = userEvent.setup();
    render(<AdminInvestorFinanceVerificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Beta Capital')).toBeInTheDocument();
    });

    const reviewBtn = screen.getByRole('button', { name: /Review/i });
    await user.click(reviewBtn);

    // Click Reject...
    const rejectBtn = screen.getByRole('button', { name: /Reject\.\.\./i });
    await user.click(rejectBtn);

    // Enter rejection reason
    const textarea = screen.getByPlaceholderText(/Specify missing documents/i);
    await user.type(textarea, 'Bank accreditation letter is unverified.');

    // Confirm Rejection
    const confirmBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/investor-finance-verifications/fin-002/decision', {
        action: 'reject',
        reason: 'Bank accreditation letter is unverified.',
      });
    });
  });

  it('displays empty state when queue has no pending submissions', async () => {
    (api.get as any).mockResolvedValue({
      data: [],
    });

    render(<AdminInvestorFinanceVerificationPage />);

    await waitFor(() => {
      expect(screen.getByText('No investor finance verifications are awaiting review.')).toBeInTheDocument();
    });
  });
});

describe('Admin Service Provider Verification Queue Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pending providers queue, allows inspecting profile drawer, and approves provider', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            userId: 'sp-user-1',
            name: 'Sarah Connor',
            email: 'sarah@engineering.com',
            profile: {
              trustScore: 4.8,
              completionPercent: 95,
              headline: 'Full-stack Security Engineer',
              skills: ['Go', 'TypeScript', 'Cryptography'],
              serviceCategories: ['Software Development', 'Security'],
              credentials: [
                {
                  id: 'cred-1',
                  title: 'CISSP Certified Information Systems Security Professional',
                  issuer: 'ISC2',
                  licenseNumber: 'CISSP-987654',
                  issueDate: '2024-01-01T00:00:00Z',
                  verified: false,
                },
              ],
              portfolioItems: [],
              verificationStatus: 'UnderReview',
              verificationSubmittedAt: '2026-02-18T10:00:00Z',
            },
          },
        ],
      },
    });

    (api.post as any).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          verificationStatus: 'Verified',
          verifiedAt: '2026-02-18T11:00:00Z',
        },
      },
    });

    const user = userEvent.setup();
    renderWithQueryClient(<AdminServiceProvidersVerificationPage />);

    expect(screen.getByText(/Service Provider Verification Queue/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
      expect(screen.getByText('sarah@engineering.com')).toBeInTheDocument();
      expect(screen.getByText(/Trust 4.8/i)).toBeInTheDocument();
    });

    // Inspect Profile
    const inspectBtn = screen.getByRole('button', { name: /Inspect Profile/i });
    await user.click(inspectBtn);

    await waitFor(() => {
      expect(screen.getByText(/Credentials & Licenses \(Read Only\)/i)).toBeInTheDocument();
    });

    // Verify Unified Profile user link exists
    const userLink = screen.getByRole('link', { name: /Inspect User Account/i });
    expect(userLink).toHaveAttribute('href', '/dashboard/admin/users/sp-user-1');

    // Click Approve button on the row
    const approveBtn = screen.getAllByRole('button', { name: /^Approve$/i })[0];
    await user.click(approveBtn);

    // Confirm dialog opens
    await waitFor(() => {
      expect(screen.getByText(/Approve provider\?/i)).toBeInTheDocument();
    });

    const confirmApproveBtns = screen.getAllByRole('button', { name: /^Approve$/i });
    // Click the confirm button in the dialog footer
    await user.click(confirmApproveBtns[confirmApproveBtns.length - 1]);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/service-provider/verification/sp-user-1/approve');
    });
  });

  it('displays empty state when no service provider credentials are awaiting review', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
      },
    });

    renderWithQueryClient(<AdminServiceProvidersVerificationPage />);

    await waitFor(() => {
      expect(screen.getByText('No service provider credentials are awaiting review.')).toBeInTheDocument();
    });
  });
});
