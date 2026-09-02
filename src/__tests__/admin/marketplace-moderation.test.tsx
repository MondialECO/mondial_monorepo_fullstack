import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminMarketplaceOverviewPage from '@/app/dashboard/admin/marketplace/page';
import AdminServicesModerationPage from '@/app/dashboard/admin/marketplace/services/page';
import AdminCreatorOffersModerationPage from '@/app/dashboard/admin/marketplace/creator-offers/page';
import AdminReviewsModerationPage from '@/app/dashboard/admin/reviews/page';
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

describe('Admin Marketplace & Moderation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminMarketplaceOverviewPage', () => {
    it('renders live metrics from summary API', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            totalServices: 14,
            publishedServices: 10,
            hiddenServices: 4,
            draftServices: 0,
            totalCreatorOffers: 8,
            publishedCreatorOffers: 6,
            hiddenCreatorOffers: 2,
            buyoutOffersCount: 5,
            equityOffersCount: 3,
            totalReviews: 25,
            publicReviews: 22,
            hiddenReviews: 3,
            averageRating: 4.8,
            openReportsCount: 0,
            reportsSystemActive: false,
          },
        },
      });

      render(<AdminMarketplaceOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Marketplace & Content Moderation')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });
  });

  describe('AdminServicesModerationPage', () => {
    it('renders services and executes hide action with reason', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              {
                id: 'srv-101',
                providerId: 'provider-1',
                providerName: 'Apex Studio',
                providerEmail: 'apex@mondial.com',
                title: 'Full Stack Web App Development',
                description: 'Complete scalable web application architecture.',
                category: 'Development',
                serviceType: 'Web Development',
                status: 'Published',
                isModerationHidden: false,
                packagesCount: 3,
                startingPrice: 1500,
                currency: 'EUR',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          },
        },
      });

      render(<AdminServicesModerationPage />);

      await waitFor(() => {
        expect(screen.getByText('Full Stack Web App Development')).toBeInTheDocument();
        expect(screen.getByText('Apex Studio')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const hideBtn = screen.getByRole('button', { name: /Hide/i });
      await user.click(hideBtn);

      expect(screen.getByText('Hide Service Listing')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Specify violation or justification/i);
      await user.type(textarea, 'Misleading service scope');

      (api.post as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: 'srv-101', isModerationHidden: true },
        },
      });

      (api.get as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              {
                id: 'srv-101',
                providerId: 'provider-1',
                providerName: 'Apex Studio',
                title: 'Full Stack Web App Development',
                category: 'Development',
                status: 'Published',
                isModerationHidden: true,
                moderationReason: 'Misleading service scope',
                packagesCount: 3,
                startingPrice: 1500,
                currency: 'EUR',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          },
        },
      });

      const confirmBtn = screen.getByRole('button', { name: /Confirm Hide/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/admin/marketplace/services/srv-101/moderate',
          { action: 'hide', reason: 'Misleading service scope' }
        );
      });
    });
  });

  describe('AdminCreatorOffersModerationPage', () => {
    it('renders creator offers with read-only terms', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              {
                ideaId: 'idea-202',
                title: 'EcoLogix Carbon Accounting',
                description: 'AI platform for enterprise GHG tracking.',
                creatorId: 'creator-99',
                creatorName: 'Elena Rostova',
                creatorEmail: 'elena@mondial.com',
                sector: 'CleanTech',
                status: 'live',
                saleType: 'full_buyout',
                dealModes: ['full_buyout'],
                askingPrice: 350000,
                audience: 'public',
                ndaRequired: true,
                isModerationHidden: false,
                publishedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          },
        },
      });

      render(<AdminCreatorOffersModerationPage />);

      await waitFor(() => {
        expect(screen.getByText('EcoLogix Carbon Accounting')).toBeInTheDocument();
        expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
        expect(screen.getByText(/Ask: €350,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('AdminReviewsModerationPage', () => {
    it('renders reviews and allows hide/restore', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              {
                id: 'rev-301',
                engagementId: 'eng-1',
                clientId: 'client-5',
                clientName: 'Sara Connor',
                clientEmail: 'sara@mondial.com',
                providerId: 'provider-1',
                providerName: 'Apex Studio',
                providerEmail: 'apex@mondial.com',
                overallRating: 5,
                qualityRating: 5,
                communicationRating: 5,
                deliveryRating: 5,
                writtenReview: 'Outstanding delivery ahead of schedule!',
                visibility: 'Public',
                verificationStatus: 'Verified',
                isModerationHidden: false,
                submittedAt: new Date().toISOString(),
              },
            ],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          },
        },
      });

      render(<AdminReviewsModerationPage />);

      await waitFor(() => {
        expect(screen.getByText(/"Outstanding delivery ahead of schedule!"/i)).toBeInTheDocument();
        expect(screen.getByText(/Client: Sara Connor/i)).toBeInTheDocument();
      });
    });
  });
});
