import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { ListingHeader } from '@/components/marketplace/detail/ListingHeader';
import { ProviderAboutCard } from '@/components/marketplace/detail/ProviderAboutCard';
import type { MarketplaceListingCard, MarketplaceListingDetail } from '@/lib/api-marketplace';

vi.mock('next/link', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef<
      HTMLAnchorElement,
      React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    >(function TestLink({ href, children, ...props }, ref) {
      return (
        <a ref={ref} href={href} {...props}>
          {children}
        </a>
      );
    }),
  };
});

const mockCardWithSlug: MarketplaceListingCard = {
  id: 'service-123',
  title: 'Full Stack Web App Development',
  category: 'Development',
  coverImageUrl: '/images/cover.png',
  provider: {
    providerId: 'provider-user-1',
    displayName: 'Sarah Developer',
    profileImageUrl: '/images/avatar.png',
    verified: true,
    publicSlug: 'sarah-developer',
  },
  startingPrice: 500,
  currency: 'EUR',
  deliveryTimeValue: 3,
  deliveryTimeUnit: 'days',
  rating: 4.9,
  reviewCount: 15,
};

const mockCardWithoutSlug: MarketplaceListingCard = {
  id: 'service-456',
  title: 'SEO Audit and Optimization',
  category: 'Marketing',
  coverImageUrl: null,
  provider: {
    providerId: 'provider-user-2',
    displayName: 'Legacy Marketer',
    profileImageUrl: null,
    verified: false,
  },
  startingPrice: 300,
  currency: 'EUR',
  deliveryTimeValue: 2,
  deliveryTimeUnit: 'days',
  rating: null,
  reviewCount: null,
};

const mockDetailWithSlug: MarketplaceListingDetail = {
  id: 'service-123',
  title: 'Full Stack Web App Development',
  category: 'Development',
  serviceType: 'Web Development',
  industryFocus: ['SaaS', 'FinTech'],
  geographicCoverage: ['Global'],
  descriptionHtml: '<p>High performance web app.</p>',
  provider: {
    providerId: 'provider-user-1',
    displayName: 'Sarah Developer',
    headline: 'Senior Full Stack Engineer',
    profileImageUrl: '/images/avatar.png',
    verified: true,
    trustScore: 4.9,
    completedOrders: 42,
    medianResponseTime: '1 hour',
    publicSlug: 'sarah-developer',
  },
  packages: [],
  gallery: [],
  previewVideo: null,
  faqs: [],
  metadataTags: ['React', 'Next.js'],
  searchTags: ['web', 'frontend'],
};

describe('MarketplaceCard Navigation', () => {
  it('links provider identity to canonical public profile /profile/{publicSlug}', () => {
    render(<MarketplaceCard card={mockCardWithSlug} />);

    const providerLink = screen.getByRole('link', { name: /Sarah Developer/i });
    expect(providerLink).toHaveAttribute('href', '/profile/sarah-developer');

    const serviceLinks = screen.getAllByRole('link').filter((link) =>
      link.getAttribute('href')?.startsWith('/marketplace/services/service-123')
    );
    expect(serviceLinks.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: /Full Stack Web App Development/i })).toBeInTheDocument();
  });

  it('renders provider identity safely as text when publicSlug is missing', () => {
    render(<MarketplaceCard card={mockCardWithoutSlug} />);

    expect(screen.getByText('Legacy Marketer')).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link.getAttribute('href')).not.toContain('/profile/');
    }
  });
});

describe('ListingHeader Navigation', () => {
  it('links provider name to /profile/{publicSlug}', () => {
    render(<ListingHeader listing={mockDetailWithSlug} />);

    const providerLink = screen.getByRole('link', { name: /Sarah Developer/i });
    expect(providerLink).toHaveAttribute('href', '/profile/sarah-developer');
  });
});

describe('ProviderAboutCard Navigation', () => {
  it('links provider name, avatar and View Profile CTA to /profile/{publicSlug}', () => {
    render(<ProviderAboutCard provider={mockDetailWithSlug.provider} onMessage={vi.fn()} />);

    const profileLinks = screen.getAllByRole('link', { name: /Sarah Developer|View Profile/i });
    expect(profileLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of profileLinks) {
      expect(link).toHaveAttribute('href', '/profile/sarah-developer');
    }
  });

  it('omits View Profile button when publicSlug is not present', () => {
    render(
      <ProviderAboutCard
        provider={{
          providerId: 'p-2',
          displayName: 'No Slug Provider',
          headline: null,
          profileImageUrl: null,
          verified: false,
          trustScore: null,
          completedOrders: null,
          medianResponseTime: null,
        }}
        onMessage={vi.fn()}
      />
    );

    expect(screen.queryByRole('link', { name: /View Profile/i })).not.toBeInTheDocument();
  });
});
