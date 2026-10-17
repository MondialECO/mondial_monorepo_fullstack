import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import CreatorDashboard from '@/app/dashboard/creator/page';
import { LanguageProvider, useTranslation } from '@/providers/LanguageProvider';
import type { CreatorDashboardSummary } from '@/types/creator/dashboard';

// Mock navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/dashboard/creator',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

// Mock Auth
vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-creator-1', name: 'Jean Dupont', email: 'jean@example.com' },
    isAuthenticated: true,
  }),
}));

// Mock Creator Progress Provider
vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: {
      activeIdeaId: 'idea-123',
      journeyState: {},
      project: { name: 'EcoVenture' },
    },
    advancePhase: vi.fn(),
    setCrossroadsPath: vi.fn(),
  }),
}));

vi.mock('@/hooks/queries/chat', () => ({
  useConversations: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock('@/hooks/queries/notifications', () => ({
  useNotifications: () => ({ notifications: [], unreadCount: 0, isLoading: false, isError: false }),
}));

vi.mock('@/components/creator/dashboard/HumainXDashboardCard', () => ({
  HumainXDashboardCard: () => React.createElement('div', { 'data-testid': 'humainx-card' }, 'HumainX Card'),
}));

const mockSummaryData: CreatorDashboardSummary = {
  project: {
    id: 'idea-123',
    name: 'EcoVenture',
    tagline: 'Sustainable packaging',
    category: 'Eco',
    clarityScore: 85,
    legalReadinessPct: 70,
    brand: {
      hasBrandKit: true,
      status: 'Ready',
      colorPalette: ['#3C61DD'],
      typographyPairing: 'Inter',
    },
  },
  nextAction: {
    key: 'needs_analysis',
    phase: 4,
    stage: 'Needs',
    title: 'Needs Analysis',
    description: 'Map required resources',
    buttonLabel: 'Open Phase 4',
    href: '/dashboard/creator/phase-4',
    priority: 'HIGH',
    type: 'MILESTONE',
    reason: 'Next step',
  },
  attentionItems: [
    {
      id: 'att-1',
      phase: 4,
      title: 'Upload bylaws draft',
      description: 'Required before company formation',
      href: '/dashboard/creator/phase-3/formation',
      severity: 'high',
      type: 'INFO',
    },
  ],
  journey: {
    currentPhase: 4,
    overallProgress: 65,
    phases: [
      { phase: 2, title: 'Identity & Brand', shortName: 'Brand', status: 'Completed', currentStep: 2, totalSteps: 2, href: '/dashboard/creator/phase-2', substageProgress: [], phaseNumber: 2 },
      { phase: 3, title: 'Business Intelligence', shortName: 'BI', status: 'Completed', currentStep: 4, totalSteps: 4, href: '/dashboard/creator/phase-3', substageProgress: [], phaseNumber: 3 },
      { phase: 4, title: 'Construction', shortName: 'Build', status: 'In Progress', currentStep: 2, totalSteps: 7, href: '/dashboard/creator/phase-4', substageProgress: [], phaseNumber: 4 },
      { phase: 5, title: 'The Crossroads', shortName: 'Cross', status: 'Locked', currentStep: 0, totalSteps: 1, href: '/dashboard/creator/crossroads', substageProgress: [], phaseNumber: 5 },
    ],
  },
  results: [],
  phase5: {
    isUnlocked: false,
    href: '/dashboard/creator/crossroads',
    guidanceText: 'Complete Phase 4 milestones to unlock.',
  },
};

vi.mock('@/hooks/queries/creator', () => ({
  useCreatorDashboardSummary: () => ({
    data: mockSummaryData,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMyIdeas: () => ({
    data: [{ id: 'idea-123', name: 'EcoVenture' }],
    isLoading: false,
    isError: false,
  }),
}));

// Test helper component to trigger language change inside tests
function LanguageSwitcherHelper() {
  const { locale, setLocale } = useTranslation();
  return (
    <div data-testid="lang-helper">
      <span data-testid="active-locale">{locale}</span>
      <button onClick={() => setLocale('fr')} data-testid="btn-to-fr">FR</button>
      <button onClick={() => setLocale('en')} data-testid="btn-to-en">EN</button>
    </div>
  );
}

describe('Creator Dashboard — Multi-language (i18n EN / FR) Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders in English by default and switches to French seamlessly', () => {
    render(
      <LanguageProvider>
        <LanguageSwitcherHelper />
        <CreatorDashboard />
      </LanguageProvider>
    );

    // 1. Initial State: English
    expect(screen.getByTestId('active-locale')).toHaveTextContent('en');
    expect(screen.getByText('Clarity Score')).toBeInTheDocument();
    expect(screen.getByText('AI Assets')).toBeInTheDocument();
    expect(screen.getByText('Legal Readiness')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText(/Items Requiring Attention/i)).toBeInTheDocument();
    expect(screen.getByText('New Idea')).toBeInTheDocument();
    expect(screen.getByText('Switch Idea')).toBeInTheDocument();

    // 2. Switch to French
    act(() => {
      screen.getByTestId('btn-to-fr').click();
    });

    // 3. Verify French Translations
    expect(screen.getByTestId('active-locale')).toHaveTextContent('fr');
    expect(screen.getByText('Score de Clarté')).toBeInTheDocument();
    expect(screen.getByText('Actifs IA')).toBeInTheDocument();
    expect(screen.getByText('Préparation Juridique')).toBeInTheDocument();
    expect(screen.getByText('Rapports')).toBeInTheDocument();
    expect(screen.getByText(/Éléments Requérant Votre Attention/i)).toBeInTheDocument();
    expect(screen.getByText('Nouvelle Idée')).toBeInTheDocument();
    expect(screen.getByText("Changer d'Idée")).toBeInTheDocument();

    // 4. Switch back to English
    act(() => {
      screen.getByTestId('btn-to-en').click();
    });

    expect(screen.getByTestId('active-locale')).toHaveTextContent('en');
    expect(screen.getByText('Clarity Score')).toBeInTheDocument();
    expect(screen.getByText('New Idea')).toBeInTheDocument();
  });

  it('translates Phase 1, Phase 2, Phase 3, and Phase 4 keys in English and French', () => {
    function TestPhaseKeys() {
      const { t, setLocale } = useTranslation();
      return (
        <div>
          <span data-testid="p1-title">{t('creator.phase1.headerTitle')}</span>
          <span data-testid="p2-clarifier">{t('creator.phase2.clarifier.title')}</span>
          <span data-testid="p2-naming">{t('creator.phase2.conceptName.title')}</span>
          <span data-testid="p2-summary">{t('creator.phase2.ideaSummary.headerTitle')}</span>
          <span data-testid="p2-branding">{t('creator.phase2.branding.headerTitle')}</span>
          <span data-testid="p2-complete">{t('creator.phase2.complete.heroTitle')}</span>
          <span data-testid="p2-hire-designer">{t('creator.phase2.hireDesigner.title')}</span>
          <span data-testid="p2-core-brand">{t('creator.phase2.complete.coreBrandTitle')}</span>
          <span data-testid="p2-logo-tool">{t('creator.phase2.logoTool.redirecting')}</span>
          <span data-testid="p2-brand-kit">{t('creator.phase2.brandKit.notInitializedTitle')}</span>
          <span data-testid="p3-resuming">{t('creator.phase3.resuming')}</span>
          <span data-testid="p3-eyebrow">{t('creator.phase3.shell.stepEyebrow')}</span>
          <span data-testid="p4-title">{t('creator.phase4.title')}</span>
          <button onClick={() => setLocale('fr')} data-testid="toggle-fr">FR</button>
        </div>
      );
    }

    render(
      <LanguageProvider>
        <TestPhaseKeys />
      </LanguageProvider>
    );

    // English assertions
    expect(screen.getByTestId('p1-title')).toHaveTextContent('Complete your profile');
    expect(screen.getByTestId('p2-clarifier')).toHaveTextContent('AI Idea Clarifier');
    expect(screen.getByTestId('p2-naming')).toHaveTextContent('Name Your Project');
    expect(screen.getByTestId('p2-summary')).toHaveTextContent('Your Idea - First draft.');
    expect(screen.getByTestId('p2-branding')).toHaveTextContent('Build your brand identity');
    expect(screen.getByTestId('p2-complete')).toHaveTextContent('Your identity is ready');
    expect(screen.getByTestId('p2-hire-designer')).toHaveTextContent('Matched Designers for Your Project');
    expect(screen.getByTestId('p2-core-brand')).toHaveTextContent('Core Brand Identity');
    expect(screen.getByTestId('p2-logo-tool')).toHaveTextContent('Redirecting to Brand Identity Studio…');
    expect(screen.getByTestId('p2-brand-kit')).toHaveTextContent('Brand Kit Not Initialized');
    expect(screen.getByTestId('p3-resuming')).toHaveTextContent('Resuming Phase 3: Business Plan Intelligence...');
    expect(screen.getByTestId('p3-eyebrow')).toHaveTextContent('Phase 3 · Business Plan Intelligence');
    expect(screen.getByTestId('p4-title')).toHaveTextContent('Construction Engine & Execution Snapshot');

    // Toggle to French
    act(() => {
      screen.getByTestId('toggle-fr').click();
    });

    // French assertions
    expect(screen.getByTestId('p1-title')).toHaveTextContent('Complétez votre profil');
    expect(screen.getByTestId('p2-clarifier')).toHaveTextContent("Clarificateur d'Idée IA");
    expect(screen.getByTestId('p2-naming')).toHaveTextContent('Nommez votre projet');
    expect(screen.getByTestId('p2-summary')).toHaveTextContent('Votre Idée - Premier brouillon.');
    expect(screen.getByTestId('p2-branding')).toHaveTextContent('Créez votre identité de marque');
    expect(screen.getByTestId('p2-complete')).toHaveTextContent('Votre identité est prête');
    expect(screen.getByTestId('p2-hire-designer')).toHaveTextContent('Designers Correspondants pour Votre Projet');
    expect(screen.getByTestId('p2-core-brand')).toHaveTextContent('Identité de Marque Principale');
    expect(screen.getByTestId('p2-logo-tool')).toHaveTextContent("Redirection vers le Studio d'Identité de Marque…");
    expect(screen.getByTestId('p2-brand-kit')).toHaveTextContent('Kit de Marque Non Initialisé');
    expect(screen.getByTestId('p3-resuming')).toHaveTextContent('Reprise de la Phase 3 : Intelligence du Business Plan...');
    expect(screen.getByTestId('p3-eyebrow')).toHaveTextContent('Phase 3 · Intelligence du Business Plan');
    expect(screen.getByTestId('p4-title')).toHaveTextContent("Moteur de construction & Vue d'ensemble de l'exécution");
  });
});
