import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AwarenessHubPage from '@/app/resident/awareness/page';

describe('AwarenessHubPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AwarenessHub header, topic tabs, and segregation matrix', () => {
    render(<AwarenessHubPage />);

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

  it('renders educational resources including video guides and SDG articles', () => {
    render(<AwarenessHubPage />);

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

  it('filters resources when a category tab is clicked', () => {
    render(<AwarenessHubPage />);

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

  it('opens and closes reader modal when View Details is clicked', () => {
    render(<AwarenessHubPage />);

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
});
