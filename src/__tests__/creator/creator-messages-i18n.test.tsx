import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/providers/LanguageProvider';
import MessagesHeader from '@/components/messaging/MessagesHeader';
import ConversationList from '@/components/messaging/ConversationList';
import ConversationThread from '@/components/messaging/ConversationThread';
import MessageComposer from '@/components/messaging/MessageComposer';
import MessageFounderButton from '@/components/messaging/MessageFounderButton';
import {
  counterpartyRoleLabel,
  participantDisplayName,
  formatRelativeTime,
  formatClockTime,
} from '@/lib/messaging-utils';
import { UserRole } from '@/lib/roles';

// Mock TanStack query hooks used by messaging
vi.mock('@/hooks/queries/chat', () => ({
  useThreadMessages: () => ({
    messages: [],
    isLoading: false,
    isError: false,
    loadOlder: vi.fn(),
    hasMore: false,
    isLoadingOlder: false,
  }),
  useSendMessage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCreateConversationByCompany: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Auth
vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-creator-1', name: 'Jean Dupont', role: UserRole.ENTREPRENEUR },
    isAuthenticated: true,
  }),
}));

function LanguageSwitcher({ targetLocale }: { targetLocale: 'en' | 'fr' }) {
  const { setLocale } = useLanguage();
  React.useEffect(() => {
    setLocale(targetLocale);
  }, [setLocale, targetLocale]);
  return null;
}

function renderWithLocale(ui: React.ReactElement, locale: 'en' | 'fr') {
  return render(
    <LanguageProvider>
      <LanguageSwitcher targetLocale={locale} />
      {ui}
    </LanguageProvider>
  );
}

describe('Messaging Utility Functions i18n', () => {
  it('localizes counterpartyRoleLabel correctly', () => {
    expect(counterpartyRoleLabel(UserRole.INVESTOR, 'en')).toBe('Entrepreneur');
    expect(counterpartyRoleLabel(UserRole.INVESTOR, 'fr')).toBe('Entrepreneur');
    expect(counterpartyRoleLabel(UserRole.ENTREPRENEUR, 'en')).toBe('Investor');
    expect(counterpartyRoleLabel(UserRole.ENTREPRENEUR, 'fr')).toBe('Investisseur');
    expect(counterpartyRoleLabel(undefined, 'fr')).toBe('Participant');
  });

  it('localizes participantDisplayName fallback', () => {
    expect(
      participantDisplayName(
        { id: '1234-abcd', name: '' },
        UserRole.ENTREPRENEUR,
        'fr'
      )
    ).toBe('Investisseur · 1234');

    expect(
      participantDisplayName(
        { id: '1234-abcd', name: '' },
        UserRole.ENTREPRENEUR,
        'en'
      )
    ).toBe('Investor · 1234');
  });

  it('formats relative time for en and fr locales', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now, 'en')).toBe('now');
    expect(formatRelativeTime(now, 'fr')).toBe("à l'instant");

    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(fiveMinAgo, 'en')).toBe('5m');
    expect(formatRelativeTime(fiveMinAgo, 'fr')).toBe('5 min');

    const twoHoursAgo = new Date(Date.now() - 2 * 3600_000).toISOString();
    expect(formatRelativeTime(twoHoursAgo, 'en')).toBe('2h');
    expect(formatRelativeTime(twoHoursAgo, 'fr')).toBe('2 h');

    const threeDaysAgo = new Date(Date.now() - 3 * 86400_000).toISOString();
    expect(formatRelativeTime(threeDaysAgo, 'en')).toBe('3d');
    expect(formatRelativeTime(threeDaysAgo, 'fr')).toBe('3 j');
  });

  it('formats clock time with locale', () => {
    const iso = '2026-10-19T14:30:00.000Z';
    const enTime = formatClockTime(iso, 'en');
    const frTime = formatClockTime(iso, 'fr');
    expect(enTime).toBeTruthy();
    expect(frTime).toBeTruthy();
  });
});

describe('MessagesHeader Component', () => {
  it('renders in English with offline status', () => {
    renderWithLocale(<MessagesHeader status="idle" />, 'en');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Messages');
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(
      screen.getByText(/Direct conversations between entrepreneurs and investors/)
    ).toBeInTheDocument();
  });

  it('renders in French with live status', () => {
    renderWithLocale(<MessagesHeader status="connected" />, 'fr');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Messages');
    expect(screen.getByText('En direct')).toBeInTheDocument();
    expect(
      screen.getByText(/Conversations directes entre entrepreneurs et investisseurs/)
    ).toBeInTheDocument();
  });
});

describe('ConversationList Component', () => {
  it('renders empty state in English', () => {
    renderWithLocale(
      <ConversationList
        conversations={[]}
        isLoading={false}
        isError={false}
        currentUserId="user-creator-1"
        currentRole={UserRole.ENTREPRENEUR}
        activeId={null}
        onSelect={vi.fn()}
      />,
      'en'
    );
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(
      screen.getByText('Start a new message to reach an investor or entrepreneur.')
    ).toBeInTheDocument();
  });

  it('renders empty state in French', () => {
    renderWithLocale(
      <ConversationList
        conversations={[]}
        isLoading={false}
        isError={false}
        currentUserId="user-creator-1"
        currentRole={UserRole.ENTREPRENEUR}
        activeId={null}
        onSelect={vi.fn()}
      />,
      'fr'
    );
    expect(screen.getByText('Aucune conversation pour l\'instant')).toBeInTheDocument();
    expect(
      screen.getByText('Démarrez un nouveau message pour contacter un investisseur ou un entrepreneur.')
    ).toBeInTheDocument();
  });

  it('renders error state in French', () => {
    renderWithLocale(
      <ConversationList
        conversations={[]}
        isLoading={false}
        isError={true}
        currentUserId="user-creator-1"
        currentRole={UserRole.ENTREPRENEUR}
        activeId={null}
        onSelect={vi.fn()}
      />,
      'fr'
    );
    expect(screen.getByText('Impossible de charger les conversations')).toBeInTheDocument();
    expect(screen.getByText('Veuillez réessayer dans un instant.')).toBeInTheDocument();
  });
});

describe('ConversationThread Component', () => {
  it('renders thread header and empty messages prompt in French', () => {
    renderWithLocale(
      <ConversationThread
        conversationId="convo-1"
        conversation={{
          id: 'convo-1',
          participants: [
            { id: 'user-creator-1', name: 'Jean Dupont' },
            { id: 'user-investor-2', name: 'Marie Curie' },
          ],
          createdAt: new Date().toISOString(),
        }}
        currentUserId="user-creator-1"
        currentRole={UserRole.ENTREPRENEUR}
        onBack={vi.fn()}
      />,
      'fr'
    );
    expect(screen.getByText('Conversation directe')).toBeInTheDocument();
    expect(screen.getByText('Aucun message pour l\'instant')).toBeInTheDocument();
    expect(
      screen.getByText('Envoyez le premier message pour démarrer la conversation.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retour aux conversations' })).toBeInTheDocument();
  });
});

describe('MessageComposer Component', () => {
  it('renders placeholder and aria labels in French', () => {
    renderWithLocale(<MessageComposer onSend={vi.fn()} />, 'fr');
    expect(screen.getByPlaceholderText('Écrivez un message…')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument();
  });

  it('renders placeholder and aria labels in English', () => {
    renderWithLocale(<MessageComposer onSend={vi.fn()} />, 'en');
    expect(screen.getByPlaceholderText('Write a message…')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });
});

describe('MessageFounderButton Component', () => {
  it('renders default button label in French and English', () => {
    const { unmount } = renderWithLocale(<MessageFounderButton companyId="comp-1" />, 'fr');
    expect(screen.getByText('Contacter le fondateur')).toBeInTheDocument();
    unmount();

    renderWithLocale(<MessageFounderButton companyId="comp-1" />, 'en');
    expect(screen.getByText('Message Founder')).toBeInTheDocument();
  });
});
