import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import ResidentPointsPage from '@/app/resident/points/page';
import * as apiClient from '@/lib/api-client';
import {
  CivicTaskItem,
  LeaderboardEntry,
  RedemptionRequest,
  ResidentPointsSummary,
  RewardItem,
} from '@/types/gamification';

vi.mock('@/lib/use-realtime-sync', () => ({
  useRealtimeSync: vi.fn(),
}));

const summary: ResidentPointsSummary = {
  total_points: 300,
  tier: 'Silver Eco-Warrior',
  verified_activities_count: 2,
  ledger_history: [],
  recent_claims: [],
};

const leaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    resident_id: 10,
    display_name: 'Re***t',
    purok_name: 'Purok 1',
    total_points: 300,
    tier: 'Silver Eco-Warrior',
    verified_activities_count: 2,
    is_current_user: true,
  },
  {
    rank: 2,
    resident_id: 20,
    display_name: 'Ma***a P***z',
    purok_name: 'Purok 2',
    total_points: 250,
    tier: 'Silver Eco-Warrior',
    verified_activities_count: 1,
    is_current_user: false,
  },
];

const availableReward: RewardItem = {
  id: 1,
  name: 'Demo Eco Kit',
  description: 'Academic demonstration catalog item.',
  points_required: 80,
  category: 'GOODS',
  stock_quantity: 2,
  image_url: '/images/rewards/rice_5kg.jpg',
  is_active: true,
  is_demo_data: true,
  created_at: '2026-11-01T00:00:00Z',
};

const redemption: RedemptionRequest = {
  id: 8,
  resident_id: 10,
  resident_name: 'Resident Demo',
  reward_id: 1,
  reward_name: 'Demo Eco Kit',
  points_spent: 80,
  claim_code: 'AB12CD34',
  status: 'PENDING',
  review_notes: null,
  fulfilled_at: null,
  created_at: '2026-11-01T00:00:00Z',
};

function makeTask(overrides: Partial<CivicTaskItem> = {}): CivicTaskItem {
  return {
    id: 'proper_segregation',
    title: 'Proper Waste Segregation',
    description: 'Demonstrate proper waste segregation.',
    points_reward: 25,
    category: 'SEGREGATION',
    status: 'AVAILABLE',
    progress_current: 0,
    progress_target: 1,
    is_repeatable: true,
    action_type: 'CLAIM_SEGREGATION',
    image_url: '/images/tasks/proper_segregation.jpg',
    ...overrides,
  };
}

function setupApi() {
  vi.spyOn(apiClient, 'getMyPointsSummary').mockResolvedValue(summary);
  vi.spyOn(apiClient, 'getInitiatives').mockResolvedValue([]);
  vi.spyOn(apiClient, 'getLeaderboard').mockResolvedValue(leaderboard);
  vi.spyOn(apiClient, 'getCivicTasks').mockResolvedValue([]);
  vi.spyOn(apiClient, 'getRewards').mockResolvedValue([availableReward]);
  vi.spyOn(apiClient, 'getMyRedemptions').mockResolvedValue([]);
}

describe('ResidentPointsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupApi();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the four resident points tabs', async () => {
    render(<ResidentPointsPage />);

    expect(await screen.findByRole('button', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Civic Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Redeem Rewards' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My Claims & Vouchers' })).toBeInTheDocument();
  });

  it('identifies the resident while showing only the masked leaderboard name for others', async () => {
    render(<ResidentPointsPage />);

    expect(await screen.findByText('You')).toBeInTheDocument();
    expect(screen.getByText('Re***t')).toBeInTheDocument();
    expect(screen.getByText('Ma***a P***z')).toBeInTheDocument();
    expect(screen.queryByText('Maria Perez')).not.toBeInTheDocument();
  });

  it('shows the no-violation task as unavailable and offers no claim action', async () => {
    vi.spyOn(apiClient, 'getCivicTasks').mockResolvedValue([
      makeTask({
        id: 'no_violation_record',
        title: 'No Violation Record',
        description: 'This academic demo task is currently unavailable.',
        category: 'COMPLIANCE',
        status: 'UNAVAILABLE',
        action_type: 'AUTO_AWARD',
      }),
    ]);
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Civic Tasks' }));

    expect(await screen.findByText('No Violation Record')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('0 / 1')).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'No Violation Record' })).queryByRole('button')
    ).not.toBeInTheDocument();
  });

  it('submits a segregation task claim with its structured activity type', async () => {
    vi.spyOn(apiClient, 'getCivicTasks').mockResolvedValue([makeTask()]);
    const submitClaim = vi.spyOn(apiClient, 'submitClaim').mockResolvedValue({
      id: 31,
      resident_id: 10,
      resident_name: 'Resident Demo',
      activity_title: 'Sorted recyclables',
      description: 'Sorted household recyclables for collection.',
      activity_type: 'SEGREGATION',
      points_requested: 25,
      status: 'PENDING',
      reviewed_by_name: null,
      review_notes: null,
      reviewed_at: null,
      created_at: '2026-11-01T00:00:00Z',
    });
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Civic Tasks' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Claim +25 pts' }));
    fireEvent.change(screen.getByLabelText('Activity Title'), {
      target: { value: 'Sorted recyclables' },
    });
    fireEvent.change(screen.getByLabelText('Description of Work Done'), {
      target: { value: 'Sorted household recyclables for collection.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Claim' }));

    await waitFor(() => {
      expect(submitClaim).toHaveBeenCalledWith(
        expect.objectContaining({
          activity_title: 'Sorted recyclables',
          description: 'Sorted household recyclables for collection.',
          activity_type: 'SEGREGATION',
        })
      );
    });
  });

  it('allows another structured segregation claim after a completed cycle', async () => {
    vi.spyOn(apiClient, 'getCivicTasks').mockResolvedValue([
      makeTask({
        status: 'COMPLETED',
        progress_current: 1,
        progress_target: 1,
      }),
    ]);
    const submitClaim = vi.spyOn(apiClient, 'submitClaim').mockResolvedValue({
      id: 32,
      resident_id: 10,
      resident_name: 'Resident Demo',
      activity_title: 'Proper Waste Segregation',
      description: 'Separated household recyclables.',
      activity_type: 'SEGREGATION',
      points_requested: 25,
      status: 'PENDING',
      reviewed_by_name: null,
      review_notes: null,
      reviewed_at: null,
      created_at: '2026-11-01T00:00:00Z',
    });
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Civic Tasks' }));

    const task = await screen.findByRole('article', { name: 'Proper Waste Segregation' });
    expect(within(task).getByText('Completed')).toBeInTheDocument();
    expect(within(task).getByText('1 / 1')).toBeInTheDocument();
    fireEvent.click(within(task).getByRole('button', { name: 'Claim again +25 pts' }));

    expect(
      await screen.findByRole('heading', { name: 'Claim SAB-Points for Civic Action' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Activity Title')).toHaveValue('Proper Waste Segregation');
    fireEvent.change(screen.getByLabelText('Description of Work Done'), {
      target: { value: 'Separated household recyclables.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Claim' }));

    await waitFor(() => {
      expect(submitClaim).toHaveBeenCalledWith(
        expect.objectContaining({
          activity_title: 'Proper Waste Segregation',
          description: 'Separated household recyclables.',
          activity_type: 'SEGREGATION',
        })
      );
    });
  });

  it('blocks redemption when the resident cannot afford an item or stock is empty', async () => {
    vi.spyOn(apiClient, 'getMyPointsSummary').mockResolvedValue({
      ...summary,
      total_points: 20,
    });
    vi.spyOn(apiClient, 'getRewards').mockResolvedValue([
      { ...availableReward, id: 2, name: 'High-cost demo reward', points_required: 100 },
      { ...availableReward, id: 3, name: 'Unavailable demo reward', points_required: 10, stock_quantity: 0 },
    ]);
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Redeem Rewards' }));

    expect(await screen.findByRole('button', { name: 'Need 80 more pts' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });

  it('hides stock quantities from the rewards catalog', async () => {
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Redeem Rewards' }));

    const rewardCard = await screen.findByText('Demo Eco Kit');
    expect(rewardCard.closest('div.flex.flex-col')).not.toHaveTextContent('Stock');
    expect(rewardCard.closest('div.flex.flex-col')).not.toHaveTextContent('2 left');
  });

  it('confirms the balance, reward cost, and remaining points before redemption', async () => {
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Redeem Rewards' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Redeem Now' }));

    const confirmation = screen.getByRole('dialog', { name: 'Confirm Redemption' });
    const balance = within(confirmation).getByText('Your Balance').parentElement;
    const cost = within(confirmation).getByText('Cost').parentElement;
    const remaining = within(confirmation).getByText('Remaining').parentElement;
    expect(balance).not.toBeNull();
    expect(cost).not.toBeNull();
    expect(remaining).not.toBeNull();
    expect(within(balance as HTMLElement).getByText('300')).toBeInTheDocument();
    expect(within(cost as HTMLElement).getByText('-80')).toBeInTheDocument();
    expect(within(remaining as HTMLElement).getByText('220')).toBeInTheDocument();
  });

  it('presents the eight-character voucher after a successful redemption', async () => {
    vi.spyOn(apiClient, 'redeemReward').mockResolvedValue(redemption);
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Redeem Rewards' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Redeem Now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Redemption' }));

    expect(await screen.findByText('AB12CD34')).toBeInTheDocument();
    expect(screen.getByText('Redemption Successful!')).toBeInTheDocument();
  });

  it('shows cancellation status and both redemption and refund ledger entries in history', async () => {
    vi.spyOn(apiClient, 'getMyRedemptions').mockResolvedValue([
      { ...redemption, status: 'CANCELLED', review_notes: 'Cancelled for this demo.' },
    ]);
    vi.spyOn(apiClient, 'getMyPointsSummary').mockResolvedValue({
      ...summary,
      ledger_history: [
        {
          id: 1,
          points: -80,
          transaction_type: 'REWARD_REDEMPTION',
          description: 'Redeemed: Demo Eco Kit (Voucher: AB12CD34)',
          created_at: '2026-11-01T00:00:00Z',
        },
        {
          id: 2,
          points: 80,
          transaction_type: 'REWARD_REFUND',
          description: 'Refunded cancelled redemption: Demo Eco Kit (Voucher: AB12CD34)',
          created_at: '2026-11-01T00:01:00Z',
        },
      ],
      recent_claims: [
        {
          id: 9,
          resident_id: 10,
          resident_name: 'Resident Demo',
          activity_title: 'Community clean-up',
          description: 'Joined the community clean-up.',
          activity_type: 'COMMUNITY_CLEANUP',
          points_requested: 25,
          status: 'PENDING',
          created_at: '2026-11-01T00:00:00Z',
        },
      ],
    });
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'My Claims & Vouchers' }));

    expect(await screen.findByText('CANCELLED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('REWARD REFUND')).toBeInTheDocument();
    expect(screen.getByText('-80 pts')).toBeInTheDocument();
    expect(screen.getByText('+80 pts')).toBeInTheDocument();
  });

  it('renders a picture at the top of each task card using an img tag with alt text and fallback', async () => {
    vi.spyOn(apiClient, 'getCivicTasks').mockResolvedValue([
      makeTask({
        id: 'first_report',
        title: 'First Report',
        image_url: '/images/tasks/first_report.jpg',
      }),
      makeTask({
        id: 'task_without_image',
        title: 'Custom Civic Task',
        image_url: null,
      }),
    ]);
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Civic Tasks' }));

    const firstReportImg = await screen.findByAltText('First Report');
    expect(firstReportImg.tagName).toBe('IMG');
    expect(firstReportImg).toHaveAttribute('src', '/images/tasks/first_report.jpg');

    const placeholderImg = screen.getByAltText('Custom Civic Task');
    expect(placeholderImg.tagName).toBe('IMG');
    expect(placeholderImg).toHaveAttribute('src', '/images/placeholder_card.jpg');
  });

  it('renders a picture at the top of each reward card using an img tag with alt text and fallback', async () => {
    vi.spyOn(apiClient, 'getRewards').mockResolvedValue([
      {
        ...availableReward,
        id: 1,
        name: '₱100 Mobile Load',
        image_url: '/images/rewards/load_100.jpg',
      },
      {
        ...availableReward,
        id: 2,
        name: 'Mystery Eco Pack',
        image_url: null,
      },
    ]);
    render(<ResidentPointsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Redeem Rewards' }));

    const loadImg = await screen.findByAltText('₱100 Mobile Load');
    expect(loadImg.tagName).toBe('IMG');
    expect(loadImg).toHaveAttribute('src', '/images/rewards/load_100.jpg');

    const mysteryImg = screen.getByAltText('Mystery Eco Pack');
    expect(mysteryImg.tagName).toBe('IMG');
    expect(mysteryImg).toHaveAttribute('src', '/images/placeholder_card.jpg');
  });

  it('shows a load error instead of an empty rewards state when the API fails', async () => {
    vi.spyOn(apiClient, 'getRewards').mockRejectedValue(new Error('Catalog unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<ResidentPointsPage />);

    expect(await screen.findByText('Unable to load your SAB-Points data.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Redeem Rewards' }));
    expect(screen.queryByText('No rewards available at the moment.')).not.toBeInTheDocument();
  });
});
