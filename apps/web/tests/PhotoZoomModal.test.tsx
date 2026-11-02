import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PhotoZoomModal } from '@/components/PhotoZoomModal';

describe('PhotoZoomModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    imageUrl: 'http://localhost:8000/api/v1/uploads/test-evidence.jpg',
    title: 'Dumped Garbage on Curb',
    subtitle: 'Report #42 Evidence Photo',
    altText: 'Evidence photo of dumped garbage',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open with title, image, and initial 100% zoom', () => {
    render(<PhotoZoomModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Dumped Garbage on Curb')).toBeInTheDocument();
    expect(screen.getByText('Report #42 Evidence Photo')).toBeInTheDocument();
    expect(screen.getByText(/RA 10173 Sanitized/i)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    const img = screen.getByAltText('Evidence photo of dumped garbage') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('http://localhost:8000/api/v1/uploads/test-evidence.jpg');
  });

  it('does not render when isOpen is false', () => {
    render(<PhotoZoomModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('zooms in and out using toolbar buttons', () => {
    render(<PhotoZoomModal {...defaultProps} />);

    const zoomInBtn = screen.getByRole('button', { name: /Zoom In/i });
    const zoomOutBtn = screen.getByRole('button', { name: /Zoom Out/i });

    // Initial state: zoom is 100%, zoom out is disabled
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(zoomOutBtn).toBeDisabled();

    // Zoom in to 150%
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('150%')).toBeInTheDocument();
    expect(zoomOutBtn).not.toBeDisabled();

    // Zoom in to 200%
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('200%')).toBeInTheDocument();

    // Zoom out back to 150%
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('resets zoom back to 100% when Reset button is clicked', () => {
    render(<PhotoZoomModal {...defaultProps} />);

    const zoomInBtn = screen.getByRole('button', { name: /Zoom In/i });
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('200%')).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Reset Zoom/i });
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('toggles zoom between 100% and 200% when clicking directly on the photo', () => {
    render(<PhotoZoomModal {...defaultProps} />);

    const img = screen.getByAltText('Evidence photo of dumped garbage');

    // Clicking image zooms to 200%
    fireEvent.click(img);
    expect(screen.getByText('200%')).toBeInTheDocument();

    // Clicking again zooms back to 100%
    fireEvent.click(img);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('triggers onClose when close button, escape key, or backdrop is clicked', () => {
    const onCloseMock = vi.fn();
    render(<PhotoZoomModal {...defaultProps} onClose={onCloseMock} />);

    // Click close button
    const closeBtn = screen.getByRole('button', { name: /Close photo viewer/i });
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(2);

    // Click backdrop
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(onCloseMock).toHaveBeenCalledTimes(3);
  });
});
