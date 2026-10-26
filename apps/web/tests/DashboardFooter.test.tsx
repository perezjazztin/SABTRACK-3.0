import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { DashboardFooter } from '@/components/DashboardFooter';

describe('DashboardFooter Component', () => {
  it('renders system name, version badge, and copyright notice', () => {
    render(<DashboardFooter />);

    // System Name
    expect(screen.getByText('SABTRACK')).toBeInTheDocument();

    // System Version
    expect(screen.getByText('v3.0.0')).toBeInTheDocument();

    // Copyright Notice with Barangay Sabang
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`©\\s*${currentYear}\\s*Barangay Sabang`, 'i'))
    ).toBeInTheDocument();
  });

  it('renders Help & Support and Privacy Policy action buttons', () => {
    render(<DashboardFooter />);

    expect(
      screen.getByRole('button', { name: /Open Help & Support dialog/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Open Privacy Policy dialog/i })
    ).toBeInTheDocument();
  });

  it('opens and closes the Help & Support modal with contact information and guidance', () => {
    render(<DashboardFooter />);

    // Initially modal is not open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click Help & Support button
    const helpBtn = screen.getByRole('button', { name: /Open Help & Support dialog/i });
    fireEvent.click(helpBtn);

    // Modal dialog is now visible
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /Help & Support/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/Barangay Sabang Solid Waste Management Desk/i)).toBeInTheDocument();

    // Verify contact details
    expect(within(dialog).getByText(/\(043\) 784-2190/i)).toBeInTheDocument();
    expect(within(dialog).getByText('swmo@sabtrack.lipa.gov.ph')).toBeInTheDocument();
    expect(within(dialog).getByText(/Monday – Friday: 8:00 AM – 5:00 PM/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Barangay Sabang Council, Lipa City, Batangas 4217/i)).toBeInTheDocument();

    // Click Close button
    const closeBtn = within(dialog).getByRole('button', { name: /Close Help & Support dialog/i });
    fireEvent.click(closeBtn);

    // Modal is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens and closes the Privacy Policy modal with RA 10173 compliance details', () => {
    render(<DashboardFooter />);

    // Initially modal is not open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click Privacy Policy button
    const privacyBtn = screen.getByRole('button', { name: /Open Privacy Policy dialog/i });
    fireEvent.click(privacyBtn);

    // Modal dialog is now visible
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /Data Privacy Policy/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/Republic Act No\. 10173 • Data Privacy Act of 2012/i)).toBeInTheDocument();

    // Verify statutory protections
    expect(within(dialog).getByText(/EXIF & GPS Telemetry Sanitization/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Role-Based Confidentiality & Integrity/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Barangay Data Protection Officer:/i)).toBeInTheDocument();

    // Click Understood button
    const understoodBtn = within(dialog).getByRole('button', { name: /Understood/i });
    fireEvent.click(understoodBtn);

    // Modal is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes open modal when Escape key is pressed', () => {
    render(<DashboardFooter />);

    // Open Help modal
    const helpBtn = screen.getByRole('button', { name: /Open Help & Support dialog/i });
    fireEvent.click(helpBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('maintains clean neumorphic soft sage UI structure', () => {
    const { container } = render(<DashboardFooter className="custom-class" />);

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer?.className).toContain('mt-auto');
    expect(footer?.className).toContain('border-t');
    expect(footer?.className).toContain('custom-class');
  });
});
