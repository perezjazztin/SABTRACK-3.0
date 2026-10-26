import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { EcoBotWidget } from '@/components/EcoBotWidget';
import * as apiClient from '@/lib/api-client';
import * as authContext from '@/lib/auth-context';

describe('EcoBotWidget Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock scrollIntoView in JSDOM
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    // Mock auth
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'resident@sabtrack.local',
        full_name: 'Faith Valencia',
        role: 'RESIDENT',
        is_active: true,
        area_id: 2,
      },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshSession: vi.fn(),
    });

    // Mock API client prompts
    vi.spyOn(apiClient, 'getEcoBotPrompts').mockResolvedValue([
      {
        id: 'p1',
        category: 'UPCYCLING',
        prompt: 'Paano gawing pataba ang balat ng gulay at prutas?',
        icon: 'Sprout',
      },
      {
        id: 'p2',
        category: 'UPCYCLING',
        prompt: 'Self-watering planter mula sa plastic bottles',
        icon: 'Recycle',
      },
    ]);
  });

  it('renders closed floating button by default with EcoBot label', () => {
    render(<EcoBotWidget />);
    const trigger = screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('EcoBot')).toBeInTheDocument();
    expect(screen.queryByText(/Waste & Upcycling AI/i)).not.toBeInTheDocument();
  });

  it('clicking trigger opens chat drawer and displays welcome message', async () => {
    render(<EcoBotWidget />);
    const trigger = screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: /EcoBot Chat Window/i })).toBeInTheDocument();
    expect(screen.getByText(/Mabuhay! Ako si/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tanungin si EcoBot/i)).toBeInTheDocument();
  });

  it('sends inquiry and renders bot response with upcycling project and citations', async () => {
    vi.spyOn(apiClient, 'queryEcoBot').mockResolvedValue({
      reply: 'Maaari mong gamitin ang mga bote ng softdrinks bilang self-watering vertical pots!',
      is_from_cache: false,
      is_fallback: false,
      model_used: 'gemini-1.5-flash-search',
      citations: [
        {
          title: 'DIY Plastic Bottle Planters Guide',
          url: 'https://example.com/diy-planter',
        },
      ],
      featured_project: {
        id: 'plastic-planter',
        title: 'Self-Watering Plastic Bottle Planter',
        category: 'PLASTIC_RECYCLING',
        materials_needed: ['1.5L bottle', 'cotton string', 'soil'],
        difficulty: 'Easy',
        estimated_time: '15 mins',
        benefits: 'Reduces plastic waste',
        steps: [
          {
            step_number: 1,
            title: 'Cut Bottle',
            instruction: 'Cut horizontally.',
          },
        ],
      },
      suggested_prompts: ['Next upcycling project'],
    });

    render(<EcoBotWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i }));

    const input = screen.getByPlaceholderText(/Tanungin si EcoBot/i);
    fireEvent.change(input, { target: { value: 'Paano i-recycle ang bote?' } });

    const sendBtn = screen.getByRole('button', { name: /Send message to EcoBot/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Maaari mong gamitin ang mga bote ng softdrinks/i)).toBeInTheDocument();
    });

    // Check featured project rendering
    expect(screen.getByText('Self-Watering Plastic Bottle Planter')).toBeInTheDocument();
    expect(screen.getByText(/DIY Upcycling Blueprint/i)).toBeInTheDocument();

    // Check web citation
    expect(screen.getByText('DIY Plastic Bottle Planters Guide')).toBeInTheDocument();
  });

  it('can minimize and close the chat drawer', () => {
    render(<EcoBotWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i }));

    const minimizeBtn = screen.getByRole('button', { name: /Minimize/i });
    fireEvent.click(minimizeBtn);
    expect(screen.getByRole('button', { name: /Expand/i })).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close chat/i });
    fireEvent.click(closeBtn);

    // Chat dialog should be closed and floating trigger button reappears
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i })).toBeInTheDocument();
  });

  it('automatically closes when the user clicks anywhere outside the chatbot window', () => {
    render(
      <div>
        <div data-testid="outside-area">Outside Content</div>
        <EcoBotWidget />
      </div>
    );

    // Open chat drawer
    fireEvent.click(screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i }));
    expect(screen.getByRole('dialog', { name: /EcoBot Chat Window/i })).toBeInTheDocument();

    // Click outside
    const outsideElement = screen.getByTestId('outside-area');
    fireEvent.mouseDown(outsideElement);

    // Chat drawer should be closed and trigger button should be visible again
    expect(screen.queryByRole('dialog', { name: /EcoBot Chat Window/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i })).toBeInTheDocument();
  });

  it('does not close when clicking inside the chatbot window', () => {
    render(<EcoBotWidget />);

    // Open chat drawer
    fireEvent.click(screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i }));
    const dialog = screen.getByRole('dialog', { name: /EcoBot Chat Window/i });
    expect(dialog).toBeInTheDocument();

    // Click inside the dialog on input or header
    const input = screen.getByPlaceholderText(/Tanungin si EcoBot/i);
    fireEvent.mouseDown(input);
    expect(screen.getByRole('dialog', { name: /EcoBot Chat Window/i })).toBeInTheDocument();

    // Click inside the dialog header
    const headerTitle = screen.getByText('Barangay Sabang Civic Assistant');
    fireEvent.mouseDown(headerTitle);
    expect(screen.getByRole('dialog', { name: /EcoBot Chat Window/i })).toBeInTheDocument();
  });

  it('allows user to easily reopen the chatbot using the chatbot icon after clicking outside', () => {
    render(<EcoBotWidget />);

    // Open chat drawer
    const openTrigger = screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i });
    fireEvent.click(openTrigger);
    expect(screen.getByRole('dialog', { name: /EcoBot Chat Window/i })).toBeInTheDocument();

    // Click outside to dismiss
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog', { name: /EcoBot Chat Window/i })).not.toBeInTheDocument();

    // Reopen using the trigger button
    const reopenTrigger = screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i });
    expect(reopenTrigger).toBeInTheDocument();
    fireEvent.click(reopenTrigger);

    // Dialog should be open again
    expect(screen.getByRole('dialog', { name: /EcoBot Chat Window/i })).toBeInTheDocument();
  });

  it('closes when clicking outside even while minimized', () => {
    render(<EcoBotWidget />);

    // Open chat drawer
    fireEvent.click(screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i }));

    // Minimize
    fireEvent.click(screen.getByRole('button', { name: /Minimize/i }));
    expect(screen.getByRole('button', { name: /Expand/i })).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog', { name: /EcoBot Chat Window/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open EcoBot Chat Assistant/i })).toBeInTheDocument();
  });
});
