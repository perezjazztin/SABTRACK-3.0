import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Footer } from '@/components/Footer';

describe('Footer Component Modern Civic Styling & Academic Attribution', () => {
  it('renders official academic title, proponents, partner LGU, and tech stack', () => {
    const { container } = render(<Footer />);

    // Official Academic Title
    expect(
      screen.getByText(/SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling/i)
    ).toBeInTheDocument();

    // Proponents
    expect(
      screen.getByText(/Jazztin H\. Perez • Faith A\. Valencia • May Sigrid M\. Dimaano/i)
    ).toBeInTheDocument();

    // Academic Course & Institution
    expect(screen.getByText(/Course: IT 313 — System Analysis and Design/i)).toBeInTheDocument();
    expect(screen.getByText(/Batangas State University – The NEU, Lipa Campus/i)).toBeInTheDocument();

    // LGU Partner
    expect(screen.getByText(/Barangay Sabang Council/i)).toBeInTheDocument();
    expect(screen.getByText(/Lipa City, Batangas, Philippines/i)).toBeInTheDocument();

    // Tech Stack Chips
    expect(screen.getByText('FastAPI')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();

    // Ensure neomorphism classes are removed from the footer
    const neuCards = container.querySelectorAll('.neu-card');
    expect(neuCards.length).toBe(0);

    const neuSockets = container.querySelectorAll('.neu-socket');
    expect(neuSockets.length).toBe(0);

    const neuChips = container.querySelectorAll('.neu-chip');
    expect(neuChips.length).toBe(0);
  });
});
