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
      screen.getByText(/Four Core Pillars of SABTRACK Awareness/i)
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

    // Verified video & article titles
    expect(
      screen.getAllByText(/RA 9003: Ecological Solid Waste Management Act/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/Backyard & Apartment Composting Guide/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Gabay: Tamang Pagtatapon at Paghihiwalay ng Basura/i).length
    ).toBeGreaterThan(0);
  });

  it('renders verified video catalog with strict authorized resources', () => {
    render(<AwarenessHubPage />);

    expect(
      screen.getByText(/Verified Video Catalog & Masterclass/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Tamang Paghihiwalay ng Basura \(Segregation & 3Rs\)/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Batas sa Basura \(RA 9003 Guidelines\)/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Paano Mag-Compost sa Bahay \(Home & Container Composting\)/i).length
    ).toBeGreaterThan(0);
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

  it('renders direct "Watch Video" links on video tutorial cards pointing to video URLs', () => {
    render(<AwarenessHubPage />);

    // Video resource cards should have "Watch Video" anchor links
    const watchVideoLinks = screen.getAllByRole('link', { name: /Watch video:/i });
    expect(watchVideoLinks.length).toBeGreaterThan(0);

    watchVideoLinks.forEach((link) => {
      expect(link).toHaveAttribute('href');
      expect(link.getAttribute('href')).toMatch(/^https:\/\/(www\.)?youtube\.com/);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('provides a direct "Watch Video on YouTube" link inside the video details modal', () => {
    render(<AwarenessHubPage />);

    // Find and click View Details for a video tutorial
    const viewDetailsButtons = screen.getAllByRole('button', { name: /View Details/i });
    fireEvent.click(viewDetailsButtons[0]);

    // Modal dialog opens
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Check modal video link
    const modalVideoLink = screen.getByRole('link', { name: /Watch Video on YouTube/i });
    expect(modalVideoLink).toBeInTheDocument();
    expect(modalVideoLink.getAttribute('href')).toMatch(/^https:\/\/(www\.)?youtube\.com/);
    expect(modalVideoLink).toHaveAttribute('target', '_blank');
  });

  it('renders direct "Read Guide" links on educational article cards pointing to verified reliable sources', () => {
    render(<AwarenessHubPage />);

    // Article resource cards should have "Read Guide" anchor links
    const readGuideLinks = screen.getAllByRole('link', { name: /Read guide:/i });
    expect(readGuideLinks.length).toBeGreaterThan(0);

    const authorizedDomains = [
      'officialgazette.gov.ph',
      'emb.gov.ph',
      'epa.gov',
      'ecobricks.org',
      'sdgs.un.org',
      'lawphil.net',
    ];

    readGuideLinks.forEach((link) => {
      expect(link).toHaveAttribute('href');
      const href = link.getAttribute('href')!;
      expect(href).toMatch(/^https:\/\//);
      const isAuthorized = authorizedDomains.some((domain) => href.includes(domain));
      expect(isAuthorized).toBe(true);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('ensures that all resource links (Watch Video and Read Guide) are unique and different from each other', () => {
    render(<AwarenessHubPage />);

    // Collect all card action links
    const watchLinks = screen.getAllByRole('link', { name: /Watch video:/i });
    const readLinks = screen.getAllByRole('link', { name: /Read guide:/i });

    const allUrls = [
      ...watchLinks.map((l) => l.getAttribute('href')),
      ...readLinks.map((l) => l.getAttribute('href')),
    ];

    expect(allUrls.length).toBeGreaterThan(0);

    // Verify there are no duplicate URLs
    const uniqueUrls = new Set(allUrls);
    expect(uniqueUrls.size).toBe(allUrls.length);
  });

  it('displays verified reliable source information inside the article details modal', () => {
    render(<AwarenessHubPage />);

    // Click "SDGs & RA 9003" tab to select an article
    const sdgTab = screen.getByRole('tab', { name: /SDGs & RA 9003/i });
    fireEvent.click(sdgTab);

    // Click View Details on first filtered article
    const viewDetailsButtons = screen.getAllByRole('button', { name: /View Details/i });
    fireEvent.click(viewDetailsButtons[0]);

    // Modal dialog should render
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Verified Reliable Internet Source/i)).toBeInTheDocument();

    const officialSourceLink = screen.getByRole('link', { name: /Read Full Official Source/i });
    expect(officialSourceLink).toBeInTheDocument();
    expect(officialSourceLink.getAttribute('href')).toMatch(/^https:\/\//);
    expect(officialSourceLink).toHaveAttribute('target', '_blank');
  });

  it('renders the Citizen Action Checklist with practical daily household habits', () => {
    render(<AwarenessHubPage />);

    expect(screen.getByText(/Barangay Sabang Citizen Action Checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Drain All Liquids First/i)).toBeInTheDocument();
    expect(screen.getByText(/Banlawan at Patuyuin \(Rinse & Dry\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Flatten Cardboard & Crush Bottles/i)).toBeInTheDocument();
    expect(screen.getByText(/Strict 30-Minute Placement Window/i)).toBeInTheDocument();
    expect(screen.getByText(/Isolate Batteries & Busted Glass/i)).toBeInTheDocument();
    expect(screen.getByText(/Compost Leaves Instead of Siga/i)).toBeInTheDocument();
  });

  it('renders the FAQ section and toggles answers open and closed when clicked', () => {
    render(<AwarenessHubPage />);

    expect(
      screen.getByText(/Frequently Asked Community Waste Questions \(FAQs\)/i)
    ).toBeInTheDocument();

    // First question button
    const firstFaqButton = screen.getByRole('button', {
      name: /Why does Barangay Sabang enforce the strict "No Segregation, No Collection" rule\?/i,
    });
    expect(firstFaqButton).toBeInTheDocument();
    expect(firstFaqButton).toHaveAttribute('aria-expanded', 'false');

    // Click to open FAQ
    fireEvent.click(firstFaqButton);
    expect(firstFaqButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(/Section 21 and Section 48 of Republic Act 9003/i)
    ).toBeInTheDocument();

    // Click again to close FAQ
    fireEvent.click(firstFaqButton);
    expect(firstFaqButton).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText(/Section 21 and Section 48 of Republic Act 9003/i)
    ).not.toBeInTheDocument();
  });

  it('renders expanded guides including EPR Act, Clean Air Act, and E-Waste safety', () => {
    render(<AwarenessHubPage />);

    expect(
      screen.getByText(/RA 11898: Extended Producer Responsibility \(EPR\) Act of 2022/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Health Hazards of Open Burning \(Pagsisiga\) & Clean Air Act/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Electronic Waste \(E-Waste\) & Household Hazardous Materials Protocol/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Materials Recovery Facility \(MRF\) Operations & Circular Economy/i)
    ).toBeInTheDocument();
  });

  it('renders Barangay Sabang sustainability benchmarks and metrics framework', () => {
    render(<AwarenessHubPage />);

    expect(
      screen.getByText(/Community Waste Diversion & Climate Action Framework/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Landfill Diversion Target/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Burning Tolerance/i)).toBeInTheDocument();
  });
});
