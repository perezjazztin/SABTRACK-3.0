import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IdCaptureModal from '@/components/verification/IdCaptureModal';

describe('IdCaptureModal Component', () => {
  const mockOnCapture = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders modal with ID alignment frame and title when isOpen is true', () => {
    render(
      <IdCaptureModal
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('heading', { name: /Scan Government ID with Camera/i })).toBeInTheDocument();
    expect(screen.getByText(/Position your ID card within this frame/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Capture ID Photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close modal/i })).toBeInTheDocument();
  });

  it('triggers onCapture with a File when Capture ID Photo is clicked', async () => {
    render(
      <IdCaptureModal
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    const captureBtn = screen.getByRole('button', { name: /Capture ID Photo/i });
    fireEvent.click(captureBtn);

    await waitFor(() => {
      expect(mockOnCapture).toHaveBeenCalledTimes(1);
      const fileArg = mockOnCapture.mock.calls[0][0];
      expect(fileArg).toBeInstanceOf(File);
      expect(fileArg.name).toBe('id_camera_scan.jpg');
    });
  });

  it('calls onClose when close icon or Cancel button is clicked', () => {
    const { rerender } = render(
      <IdCaptureModal
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Close modal/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
