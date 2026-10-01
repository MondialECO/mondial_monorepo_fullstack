import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ACTIVE_IDEA_SIGNAL_KEY,
  getTabId,
  getAuthUserId,
  notifyActiveIdeaChanged,
  buildReloadUrlForNewIdea,
  registerSaveCancellation,
  cancelAllPendingSaves,
  isTabReloadingForSwitch,
  setTabReloadingForSwitch,
} from '@/lib/creator-tab-sync';

describe('Creator Tab Synchronization Coordinator', () => {
  beforeEach(() => {
    localStorage.clear();
    setTabReloadingForSwitch(false);
    vi.restoreAllMocks();
  });

  it('1. Tab ID is stable within the same window execution', () => {
    const id1 = getTabId();
    const id2 = getTabId();
    expect(id1).toBeTruthy();
    expect(id1).toBe(id2);
  });

  it('2. getAuthUserId extracts the user id from localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'user-xyz-123', name: 'Founder' }));
    expect(getAuthUserId()).toBe('user-xyz-123');
  });

  it('3. notifyActiveIdeaChanged writes user-scoped payload to localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'user-999' }));
    notifyActiveIdeaChanged('idea-target-456');

    const stored = localStorage.getItem(ACTIVE_IDEA_SIGNAL_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.ideaId).toBe('idea-target-456');
    expect(parsed.userId).toBe('user-999');
    expect(parsed.tabId).toBe(getTabId());
    expect(typeof parsed.timestamp).toBe('number');
  });

  it('4. buildReloadUrlForNewIdea sets ideaId and removes legacy ?idea=', () => {
    const original = 'http://localhost:3000/dashboard/creator/phase-4/pricing?idea=old-1&preview=true#section';
    const target = buildReloadUrlForNewIdea(original, 'new-idea-2');

    expect(target).toContain('/dashboard/creator/phase-4/pricing');
    expect(target).toContain('ideaId=new-idea-2');
    expect(target).not.toContain('idea=old-1');
    expect(target).toContain('preview=true');
    expect(target).toContain('#section');
  });

  it('5. buildReloadUrlForNewIdea updates existing ?ideaId= smoothly', () => {
    const original = 'http://localhost:3000/dashboard/creator/phase-4/launch-assets?ideaId=idea-A';
    const target = buildReloadUrlForNewIdea(original, 'idea-B');

    expect(target).toBe('/dashboard/creator/phase-4/launch-assets?ideaId=idea-B');
  });

  it('6. cancelAllPendingSaves invokes all registered callbacks and sets reloading flag', () => {
    const cancel1 = vi.fn();
    const cancel2 = vi.fn();

    const unreg1 = registerSaveCancellation(cancel1);
    registerSaveCancellation(cancel2);

    expect(isTabReloadingForSwitch()).toBe(false);

    cancelAllPendingSaves();

    expect(isTabReloadingForSwitch()).toBe(true);
    expect(cancel1).toHaveBeenCalledTimes(1);
    expect(cancel2).toHaveBeenCalledTimes(1);

    // Unregister callback
    unreg1();
    cancelAllPendingSaves();
    expect(cancel1).toHaveBeenCalledTimes(1);
    expect(cancel2).toHaveBeenCalledTimes(2);
  });
});
