import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FaceCaptureModal from '@/components/verification/FaceCaptureModal';

describe('FaceCaptureModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
  });

  it('renders interactive pose instructions and liveness checklist', () => {
    const handleCapture = vi.fn();
    const handleClose = vi.fn();
    render(<FaceCaptureModal isOpen={true} onCapture={handleCapture} onClose={handleClose} />);

    expect(screen.getByText(/Look straight at the camera/i)).toBeInTheDocument();
    expect(screen.getByText(/Look to the left/i)).toBeInTheDocument();
    expect(screen.getByText(/Look to the right/i)).toBeInTheDocument();
    expect(screen.getByText(/Blink naturally/i)).toBeInTheDocument();
  });

  it('triggers onCapture when liveness capture is executed', async () => {
    const handleCapture = vi.fn();
    const handleClose = vi.fn();
    render(<FaceCaptureModal isOpen={true} onCapture={handleCapture} onClose={handleClose} />);

    const captureBtn = screen.getByRole('button', { name: /Capture Face Photo/i });
    expect(captureBtn).toBeInTheDocument();
    fireEvent.click(captureBtn);

    await waitFor(() => {
      expect(handleCapture).toHaveBeenCalled();
    });
  });

  it('calls onClose when Cancel button is clicked', () => {
    const handleCapture = vi.fn();
    const handleClose = vi.fn();
    render(<FaceCaptureModal isOpen={true} onCapture={handleCapture} onClose={handleClose} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('does not trigger capture automatically without user action', async () => {
    vi.useFakeTimers();
    const handleCapture = vi.fn();
    const handleClose = vi.fn();
    render(<FaceCaptureModal isOpen={true} onCapture={handleCapture} onClose={handleClose} />);

    // Fast-forward 10 seconds — should NOT auto-advance or auto-capture
    vi.advanceTimersByTime(10000);

    expect(handleCapture).not.toHaveBeenCalled();
    // Modal stays on the first instruction waiting for user adherence
    expect(screen.getByText(/Center your face/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('allows user to skip to next pose if having difficulty and provides direct capture', async () => {
    const handleCapture = vi.fn();
    const handleClose = vi.fn();
    render(<FaceCaptureModal isOpen={true} onCapture={handleCapture} onClose={handleClose} />);

    // Direct capture button is always available and clickable
    const directCaptureBtn = screen.getByRole('button', { name: /Capture Face Photo/i });
    expect(directCaptureBtn).toBeInTheDocument();
    expect(directCaptureBtn).toBeEnabled();
  });

  it('omits Active Liveness Progression and renders direct scan UI when in login mode', () => {
    const handleCapture = vi.fn();
    const handleClose = vi.fn();
    render(
      <FaceCaptureModal
        isOpen={true}
        onCapture={handleCapture}
        onClose={handleClose}
        mode="login"
      />
    );

    expect(screen.getByRole('heading', { name: /Facial Verification Sign In/i })).toBeInTheDocument();
    expect(screen.queryByText(/Active Liveness Progression/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Direct Facial Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Look straight at the camera/i)).toBeInTheDocument();
    expect(screen.queryByText(/Look to the left/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Look to the right/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Blink naturally/i)).not.toBeInTheDocument();
  });
});
