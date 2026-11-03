import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AwarenessHubPage from '@/app/resident/awareness/page';

const completedArticleId = 'article-sdgs-sabtrack';
const readingStatus = {
  completed_article_ids: [] as string[],
  awards_today: 0,
  daily_limit: 3,
  points_per_article: 5,
  minimum_read_seconds: 20,
};

let statusResponse: typeof readingStatus;
let openSessions: Array<{ article_id: string; session_id: string | null; opened_at: string | null; already_read: boolean }>;
let completionResponse: {
  article_id: string;
  status: 'AWARDED' | 'ALREADY_READ' | 'DAILY_LIMIT_REACHED';
  points_awarded: number;
  awards_today: number;
};
let statusFailure: boolean;
let fetchSpy: ReturnType<typeof vi.fn>;

function jsonResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
  };
}

async function flushMicrotasks() {
  await act(async () => {
    for (let index = 0; index < 5; index += 1) {
      await Promise.resolve();
    }
  });
}

async function waitForStatusLoad() {
  await screen.findByText(/Today's article awards: \d+ \/ \d+/);
}

function scrollToEnd(element: HTMLElement) {
  Object.defineProperties(element, {
    scrollTop: { configurable: true, value: 100 },
    scrollHeight: { configurable: true, value: 200 },
    clientHeight: { configurable: true, value: 100 },
  });
  fireEvent.scroll(element);
}

describe('AwarenessHubPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statusResponse = { ...readingStatus };
    openSessions = [];
    completionResponse = {
      article_id: completedArticleId,
      status: 'AWARDED',
      points_awarded: 5,
      awards_today: 1,
    };
    statusFailure = false;
    fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/v1/gamification/article-reading/status')) {
        return statusFailure
          ? jsonResponse({ detail: 'Reading status unavailable.' }, false)
          : jsonResponse(statusResponse);
      }
      if (url.includes('/api/v1/gamification/article-reading/open')) {
        const request = JSON.parse(String(init?.body)) as { article_id: string };
        const session = {
          article_id: request.article_id,
          session_id: `session-${openSessions.length + 1}`,
          opened_at: '2026-11-01T13:00:00Z',
          already_read: false,
        };
        openSessions.push(session);
        return jsonResponse(session);
      }
      if (url.includes('/api/v1/gamification/article-reading/complete')) {
        if (completionResponse.status === 'AWARDED') {
          statusResponse = {
            ...statusResponse,
            awards_today: completionResponse.awards_today,
            completed_article_ids: Array.from(
              new Set([...statusResponse.completed_article_ids, completionResponse.article_id])
            ),
          };
        } else if (completionResponse.status === 'DAILY_LIMIT_REACHED') {
          statusResponse = {
            ...statusResponse,
            awards_today: completionResponse.awards_today,
          };
        }
        return jsonResponse(completionResponse);
      }
      if (url.includes('/api/v1/gamification/my-points')) {
        return jsonResponse({
          total_points: 5,
          tier: 'Bronze',
          verified_activities_count: 0,
          ledger_history: [],
          recent_claims: [],
        });
      }
      throw new Error(`Unexpected API request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders AwarenessHub header, topic tabs, and segregation matrix', async () => {
    render(<AwarenessHubPage />);
    await waitForStatusLoad();

    expect(
      screen.getByText(/AwarenessHub: Waste, SDGs & Climate Action/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Barangay Sabang Waste Segregation Matrix/i)
    ).toBeInTheDocument();

    // Verify all 4 bins render
    expect(screen.getByText(/Biodegradable \(Nabubulok\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Recyclables \(Maaaring I-recycle\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Residual Waste \(Di-Nabubulok\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Special \/ Hazardous \(Mapanganib\)/i)).toBeInTheDocument();
  });

  it('renders educational resources including video guides and SDG articles', async () => {
    render(<AwarenessHubPage />);
    await waitForStatusLoad();

    expect(
      screen.getByText(/Sustainable Development Goals \(SDGs\) & Digital Governance/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/RA 9003: Ecological Solid Waste Management Act/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Backyard & Apartment Composting Guide/i)
    ).toBeInTheDocument();
  });

  it('filters resources when a category tab is clicked', async () => {
    render(<AwarenessHubPage />);
    await waitForStatusLoad();

    // Click "Home Composting" tab
    const compostingTab = screen.getByRole('tab', { name: /Home Composting/i });
    fireEvent.click(compostingTab);

    // Composting article should be visible
    expect(
      screen.getByText(/Backyard & Apartment Composting Guide/i)
    ).toBeInTheDocument();

    // Non-composting guide should be filtered out
    expect(
      screen.queryByText(/Sustainable Development Goals \(SDGs\) & Digital Governance/i)
    ).not.toBeInTheDocument();
  });

  it('opens and closes reader modal when View Details is clicked', async () => {
    render(<AwarenessHubPage />);
    await waitForStatusLoad();

    const viewDetailsButtons = screen.getAllByRole('button', { name: /View Details/i });
    expect(viewDetailsButtons.length).toBeGreaterThan(0);

    // Open first resource modal
    fireEvent.click(viewDetailsButtons[0]);

    // Modal should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Key Citizen Takeaways/i)).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByRole('button', { name: /Close Guide/i });
    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('test_banner_explains_article_reward_rule', async () => {
    render(<AwarenessHubPage />);
    await waitForStatusLoad();

    expect(
      screen.getByText(/eligible articles earn 5 SAB-Points after at least 20 seconds/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/reach the end and select Mark as Read, up to three articles per day/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/each article can earn points only once/i)).toBeInTheDocument();
  });

  it('test_completed_articles_show_read_badge', async () => {
    statusResponse = { ...readingStatus, completed_article_ids: [completedArticleId] };
    render(<AwarenessHubPage />);

    expect(await screen.findByText('Read ✓')).toBeInTheDocument();
    expect(
      fetchSpy.mock.calls.some(([url]) =>
        String(url).includes('/api/v1/gamification/article-reading/open')
      )
    ).toBe(false);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/gamification/article-reading/status'),
      expect.any(Object)
    );
  });

  it('test_opening_article_starts_server_session', async () => {
    render(<AwarenessHubPage />);
    fireEvent.click(screen.getByRole('tab', { name: /SDGs & RA 9003/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /View Details/i })[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/gamification/article-reading/open'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ article_id: completedArticleId }),
        })
      );
    });
    expect(openSessions[0].session_id).toBe('session-1');
  });

  it('test_mark_as_read_requires_timer_and_scroll_end', async () => {
    vi.useFakeTimers();
    render(<AwarenessHubPage />);
    fireEvent.click(screen.getByRole('tab', { name: /SDGs & RA 9003/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /View Details/i })[0]);

    await flushMicrotasks();
    const markAsRead = screen.getByRole('button', { name: /Mark as Read/i });
    expect(markAsRead).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    expect(markAsRead).toBeDisabled();

    scrollToEnd(screen.getByRole('region', { name: /Article content/i }));
    expect(markAsRead).toBeEnabled();
  });

  it('allows marking read after the timer when article content fits without scrolling', async () => {
    vi.useFakeTimers();
    render(<AwarenessHubPage />);
    fireEvent.click(screen.getByRole('tab', { name: /SDGs & RA 9003/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /View Details/i })[0]);

    const content = screen.getByRole('region', { name: /Article content/i });
    Object.defineProperties(content, {
      scrollHeight: { configurable: true, value: 180 },
      clientHeight: { configurable: true, value: 220 },
    });
    await flushMicrotasks();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    expect(screen.getByRole('button', { name: /Mark as Read/i })).toBeEnabled();
  });

  it('test_success_awards_five_points_and_refreshes_summary', async () => {
    vi.useFakeTimers();
    render(<AwarenessHubPage />);
    fireEvent.click(screen.getByRole('tab', { name: /SDGs & RA 9003/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /View Details/i })[0]);
    await flushMicrotasks();
    const markAsRead = screen.getByRole('button', { name: /Mark as Read/i });

    scrollToEnd(screen.getByRole('region', { name: /Article content/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    fireEvent.click(markAsRead);

    await flushMicrotasks();
    expect(screen.getByText('+5 SAB-Points')).toBeInTheDocument();
    expect(screen.getByText('Current balance: 5 SAB-Points')).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/gamification/article-reading/complete'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ session_id: 'session-1' }),
      })
    );
    expect(
      fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api/v1/gamification/my-points'))
    ).toHaveLength(1);
    expect(screen.getAllByText('Read ✓').length).toBeGreaterThan(0);
  });

  it('test_daily_limit_keeps_article_unread_and_shows_message', async () => {
    vi.useFakeTimers();
    completionResponse = {
      article_id: completedArticleId,
      status: 'DAILY_LIMIT_REACHED',
      points_awarded: 0,
      awards_today: 3,
    };
    render(<AwarenessHubPage />);
    fireEvent.click(screen.getByRole('tab', { name: /SDGs & RA 9003/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /View Details/i })[0]);

    await flushMicrotasks();
    const markAsRead = screen.getByRole('button', { name: /Mark as Read/i });
    scrollToEnd(screen.getByRole('region', { name: /Article content/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    fireEvent.click(markAsRead);
    await flushMicrotasks();

    expect(
      screen.getByText(
        'You’ve reached today’s reading limit. Come back tomorrow to earn 5 SAB-Points for this article.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('Read ✓')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close Guide/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /View Details/i })[0]);
    await flushMicrotasks();
    expect(openSessions).toHaveLength(2);
  });

  it('test_video_synopsis_does_not_start_read_session', async () => {
    render(<AwarenessHubPage />);
    fireEvent.click(screen.getByRole('tab', { name: /Watch & Learn/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /View Details/i })[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(
      fetchSpy.mock.calls.some(([url]) =>
        String(url).includes('/api/v1/gamification/article-reading/open')
      )
    ).toBe(false);
  });

  it('test_reading_status_error_is_surfaced', async () => {
    statusFailure = true;
    render(<AwarenessHubPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load article reading status/i);
  });
});
